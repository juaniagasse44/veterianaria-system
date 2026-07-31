import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import {
  Appointment,
  AppointmentReason,
  AppointmentStatus,
} from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';

interface FakeQueryBuilder {
  where: jest.Mock<FakeQueryBuilder, [string, object?]>;
  andWhere: jest.Mock<FakeQueryBuilder, [string, object?]>;
  getCount: jest.Mock<Promise<number>, []>;
}

interface FakeManager {
  query: jest.Mock<Promise<unknown>, unknown[]>;
  createQueryBuilder: jest.Mock<FakeQueryBuilder, unknown[]>;
  create: jest.Mock<
    Record<string, unknown>,
    [unknown, Record<string, unknown>]
  >;
  save: jest.Mock<Promise<Record<string, unknown>>, [Record<string, unknown>]>;
}

function mockQueryBuilder(getCountResult: number): FakeQueryBuilder {
  const qb = {} as FakeQueryBuilder;
  qb.where = jest.fn<FakeQueryBuilder, [string, object?]>().mockReturnValue(qb);
  qb.andWhere = jest
    .fn<FakeQueryBuilder, [string, object?]>()
    .mockReturnValue(qb);
  qb.getCount = jest
    .fn<Promise<number>, []>()
    .mockResolvedValue(getCountResult);
  return qb;
}

function mockManager(overlapCount: number): FakeManager {
  return mockManagerWithOverlaps([overlapCount]);
}

/** Cada llamado a `createQueryBuilder` (chequeo de solapamiento por
 * veterinario, luego por mascota) devuelve el siguiente `getCount` de la
 * lista; el último valor se repite si hay más llamados que elementos. */
function mockManagerWithOverlaps(overlapCounts: number[]): FakeManager {
  let call = 0;
  return {
    query: jest.fn<Promise<unknown>, unknown[]>().mockResolvedValue(undefined),
    createQueryBuilder: jest
      .fn<FakeQueryBuilder, unknown[]>()
      .mockImplementation(() => {
        const count = overlapCounts[Math.min(call, overlapCounts.length - 1)];
        call += 1;
        return mockQueryBuilder(count);
      }),
    create: jest.fn<
      Record<string, unknown>,
      [unknown, Record<string, unknown>]
    >((_entity, data) => data),
    save: jest.fn<Promise<Record<string, unknown>>, [Record<string, unknown>]>(
      (entity) => Promise.resolve({ id: 1, ...entity }),
    ),
  };
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  type TransactionMock = jest.Mock<
    Promise<unknown>,
    [(manager: FakeManager) => Promise<unknown>]
  >;
  let dataSource: { transaction: TransactionMock };
  let appointmentsRepository: { findOne: jest.Mock; save: jest.Mock };
  let petsRepository: { findOne: jest.Mock };
  let veterinariansRepository: { findOne: jest.Mock };

  const activePet: Pet = { id: 1, active: true } as Pet;
  const activeVet: Veterinarian = { id: 1, active: true } as Veterinarian;

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn<
        Promise<unknown>,
        [(manager: FakeManager) => Promise<unknown>]
      >(),
    };
    appointmentsRepository = { findOne: jest.fn(), save: jest.fn() };
    petsRepository = { findOne: jest.fn().mockResolvedValue(activePet) };
    veterinariansRepository = {
      findOne: jest.fn().mockResolvedValue(activeVet),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: DataSource, useValue: dataSource },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentsRepository,
        },
        { provide: getRepositoryToken(Pet), useValue: petsRepository },
        {
          provide: getRepositoryToken(Veterinarian),
          useValue: veterinariansRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
  });

  const futureIso = (hoursFromNow: number) =>
    new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();

  describe('create — solapamiento (D2/D3)', () => {
    it('crea el turno cuando no hay solapamiento', async () => {
      const manager = mockManager(0);
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      const result = await service.create({
        petId: 1,
        veterinarianId: 1,
        startAt: futureIso(24),
        durationMinutes: 30,
        reason: AppointmentReason.CONSULTA,
      });

      expect(result.status).toBe(AppointmentStatus.PENDIENTE);
      expect(manager.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock($1, $2)',
        [1, 1],
      );
      expect(manager.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock($1, $2)',
        [2, 1],
      );
    });

    it('rechaza con 409 cuando el mismo veterinario ya tiene un turno solapado', async () => {
      const manager = mockManager(1);
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.create({
          petId: 1,
          veterinarianId: 1,
          startAt: futureIso(24),
          durationMinutes: 30,
          reason: AppointmentReason.CONSULTA,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza con 409 cuando la misma mascota ya tiene un turno solapado con otro veterinario', async () => {
      // Chequeo de veterinario pasa (0), chequeo de mascota encuentra solapamiento (1).
      const manager = mockManagerWithOverlaps([0, 1]);
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.create({
          petId: 1,
          veterinarianId: 2,
          startAt: futureIso(24),
          durationMinutes: 30,
          reason: AppointmentReason.CONSULTA,
        }),
      ).rejects.toThrow('La mascota ya tiene un turno en ese horario');
    });

    it('permite el mismo horario con otro veterinario y otra mascota (no comparte lock/consulta)', async () => {
      const manager = mockManager(0);
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      await service.create({
        petId: 3,
        veterinarianId: 2,
        startAt: futureIso(24),
        durationMinutes: 30,
        reason: AppointmentReason.CONSULTA,
      });

      expect(manager.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock($1, $2)',
        [1, 2],
      );
      expect(manager.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock($1, $2)',
        [2, 3],
      );
    });

    it('la query de solapamiento excluye CANCELADO', async () => {
      const manager = mockManager(0);
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      await service.create({
        petId: 1,
        veterinarianId: 1,
        startAt: futureIso(24),
        durationMinutes: 30,
        reason: AppointmentReason.CONSULTA,
      });

      const qb = manager.createQueryBuilder.mock.results[0]
        .value as FakeQueryBuilder;
      expect(qb.andWhere).toHaveBeenCalledWith(
        'appointment.status != :cancelled',
        { cancelled: AppointmentStatus.CANCELADO },
      );
    });
  });

  describe('create — validaciones (D5)', () => {
    it('rechaza un turno en el pasado sin llegar a abrir transacción', async () => {
      await expect(
        service.create({
          petId: 1,
          veterinarianId: 1,
          startAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          durationMinutes: 30,
          reason: AppointmentReason.CONSULTA,
        }),
      ).rejects.toThrow(ConflictException);

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rechaza si endAt no es posterior a startAt', async () => {
      const startAt = futureIso(24);
      const endAt = futureIso(23);

      await expect(
        service.create({
          petId: 1,
          veterinarianId: 1,
          startAt,
          endAt,
          reason: AppointmentReason.CONSULTA,
        }),
      ).rejects.toThrow('La fecha de fin debe ser posterior al inicio');
    });

    it('404 si la mascota no existe o está inactiva', async () => {
      petsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          petId: 999,
          veterinarianId: 1,
          startAt: futureIso(24),
          durationMinutes: 30,
          reason: AppointmentReason.CONSULTA,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('404 si el veterinario no existe o está inactivo', async () => {
      veterinariansRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          petId: 1,
          veterinarianId: 999,
          startAt: futureIso(24),
          durationMinutes: 30,
          reason: AppointmentReason.CONSULTA,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeStatus — transiciones (D4)', () => {
    const withStatus = (status: AppointmentStatus): Appointment =>
      ({ id: 1, status }) as Appointment;

    it('permite PENDIENTE -> CONFIRMADO', async () => {
      appointmentsRepository.findOne.mockResolvedValue(
        withStatus(AppointmentStatus.PENDIENTE),
      );
      appointmentsRepository.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.changeStatus(1, {
        status: AppointmentStatus.CONFIRMADO,
      });
      expect(result.status).toBe(AppointmentStatus.CONFIRMADO);
    });

    it('permite CONFIRMADO -> ATENDIDO', async () => {
      appointmentsRepository.findOne.mockResolvedValue(
        withStatus(AppointmentStatus.CONFIRMADO),
      );
      appointmentsRepository.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.changeStatus(1, {
        status: AppointmentStatus.ATENDIDO,
      });
      expect(result.status).toBe(AppointmentStatus.ATENDIDO);
    });

    it('permite PENDIENTE -> CANCELADO', async () => {
      appointmentsRepository.findOne.mockResolvedValue(
        withStatus(AppointmentStatus.PENDIENTE),
      );
      appointmentsRepository.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.changeStatus(1, {
        status: AppointmentStatus.CANCELADO,
      });
      expect(result.status).toBe(AppointmentStatus.CANCELADO);
    });

    it('rechaza PENDIENTE -> ATENDIDO (no se puede saltear CONFIRMADO)', async () => {
      appointmentsRepository.findOne.mockResolvedValue(
        withStatus(AppointmentStatus.PENDIENTE),
      );

      await expect(
        service.changeStatus(1, { status: AppointmentStatus.ATENDIDO }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza CANCELADO -> ATENDIDO (no se puede atender un turno cancelado)', async () => {
      appointmentsRepository.findOne.mockResolvedValue(
        withStatus(AppointmentStatus.CANCELADO),
      );

      await expect(
        service.changeStatus(1, { status: AppointmentStatus.ATENDIDO }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza ATENDIDO -> CANCELADO (estado terminal)', async () => {
      appointmentsRepository.findOne.mockResolvedValue(
        withStatus(AppointmentStatus.ATENDIDO),
      );

      await expect(
        service.changeStatus(1, { status: AppointmentStatus.CANCELADO }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
