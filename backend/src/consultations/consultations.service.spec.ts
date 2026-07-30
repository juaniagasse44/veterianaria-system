import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConsultationsService } from './consultations.service';
import { Consultation } from './entities/consultation.entity';
import { Pet } from '../pets/entities/pet.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';

type FindOneEntity = typeof Appointment | typeof Veterinarian;

interface FakeManager {
  findOne: jest.Mock<
    Promise<Partial<Appointment> | Partial<Veterinarian> | null>,
    [FindOneEntity, object?]
  >;
  update: jest.Mock<Promise<void>, unknown[]>;
  create: jest.Mock<
    Record<string, unknown>,
    [unknown, Record<string, unknown>]
  >;
  save: jest.Mock<Promise<unknown>, [unknown]>;
}

function buildManager(options: {
  appointment?: Partial<Appointment> | null;
  veterinarian?: Partial<Veterinarian> | null;
}): FakeManager {
  const veterinarian: Partial<Veterinarian> | null =
    'veterinarian' in options
      ? (options.veterinarian ?? null)
      : { id: 1, active: true };

  return {
    findOne: jest.fn<
      Promise<Partial<Appointment> | Partial<Veterinarian> | null>,
      [FindOneEntity, object?]
    >((entity) => {
      if (entity === Appointment)
        return Promise.resolve(options.appointment ?? null);
      if (entity === Veterinarian) return Promise.resolve(veterinarian);
      return Promise.resolve(null);
    }),
    update: jest.fn<Promise<void>, unknown[]>().mockResolvedValue(undefined),
    create: jest.fn<
      Record<string, unknown>,
      [unknown, Record<string, unknown>]
    >((_entity, data) => data),
    save: jest.fn<Promise<unknown>, [unknown]>((entity) =>
      Promise.resolve(entity),
    ),
  };
}

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  type TransactionMock = jest.Mock<
    Promise<unknown>,
    [(manager: FakeManager) => Promise<unknown>]
  >;
  let dataSource: { transaction: TransactionMock };
  let petsRepository: { findOne: jest.Mock };

  const activePet: Pet = { id: 1, active: true } as Pet;

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn<
        Promise<unknown>,
        [(manager: FakeManager) => Promise<unknown>]
      >(),
    };
    petsRepository = { findOne: jest.fn().mockResolvedValue(activePet) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Consultation), useValue: {} },
        { provide: getRepositoryToken(Pet), useValue: petsRepository },
      ],
    }).compile();

    service = moduleRef.get(ConsultationsService);
  });

  it('404 si la mascota no existe o está inactiva (no abre transacción)', async () => {
    petsRepository.findOne.mockResolvedValue(null);

    await expect(service.create({ petId: 999, reason: 'x' })).rejects.toThrow(
      NotFoundException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('registra la consulta sin turno (urgencia) y no toca ningún appointment', async () => {
    const manager = buildManager({});
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.create({ petId: 1, reason: 'Urgencia' });

    expect(result.appointmentId).toBeNull();
    expect(manager.findOne).not.toHaveBeenCalledWith(
      Appointment,
      expect.anything(),
    );
  });

  it('404 si el appointmentId no existe', async () => {
    const manager = buildManager({ appointment: null });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.create({ petId: 1, appointmentId: 999, reason: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('409 si el turno no corresponde a la mascota indicada', async () => {
    const manager = buildManager({
      appointment: {
        id: 5,
        petId: 2,
        veterinarianId: 3,
        status: AppointmentStatus.PENDIENTE,
      },
    });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.create({ petId: 1, appointmentId: 5, reason: 'x' }),
    ).rejects.toThrow(ConflictException);
  });

  it('409 si el turno está CANCELADO', async () => {
    const manager = buildManager({
      appointment: {
        id: 5,
        petId: 1,
        veterinarianId: 3,
        status: AppointmentStatus.CANCELADO,
      },
    });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.create({ petId: 1, appointmentId: 5, reason: 'x' }),
    ).rejects.toThrow(ConflictException);
  });

  it('marca el turno ATENDIDO al registrar la consulta (D2), incluso viniendo de PENDIENTE', async () => {
    const appointment: Partial<Appointment> = {
      id: 5,
      petId: 1,
      veterinarianId: 3,
      status: AppointmentStatus.PENDIENTE,
    };
    const manager = buildManager({ appointment });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.create({ petId: 1, appointmentId: 5, reason: 'Control' });

    expect(appointment.status).toBe(AppointmentStatus.ATENDIDO);
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, status: AppointmentStatus.ATENDIDO }),
    );
  });

  it('toma el veterinarianId del turno si no vino explícito', async () => {
    const appointment: Partial<Appointment> = {
      id: 5,
      petId: 1,
      veterinarianId: 7,
      status: AppointmentStatus.CONFIRMADO,
    };
    const manager = buildManager({ appointment });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.create({
      petId: 1,
      appointmentId: 5,
      reason: 'x',
    });

    expect(result.veterinarianId).toBe(7);
  });

  it('no reescribe el turno si ya estaba ATENDIDO (idempotente)', async () => {
    const appointment: Partial<Appointment> = {
      id: 5,
      petId: 1,
      veterinarianId: 3,
      status: AppointmentStatus.ATENDIDO,
    };
    const manager = buildManager({ appointment });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.create({ petId: 1, appointmentId: 5, reason: 'x' });

    expect(manager.save).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 5 }),
    );
  });

  it('actualiza pets.weight cuando la consulta trae weight (D3)', async () => {
    const manager = buildManager({});
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.create({ petId: 1, reason: 'x', weight: 12.5 });

    expect(manager.update).toHaveBeenCalledWith(
      Pet,
      { id: 1 },
      { weight: 12.5 },
    );
  });

  it('no toca pets.weight si la consulta no trae weight', async () => {
    const manager = buildManager({});
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.create({ petId: 1, reason: 'x' });

    expect(manager.update).not.toHaveBeenCalled();
  });

  it('404 si el veterinario indicado no existe/está inactivo', async () => {
    const manager = buildManager({ veterinarian: null });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.create({ petId: 1, veterinarianId: 999, reason: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });
});
