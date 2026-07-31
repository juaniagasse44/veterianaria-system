import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ChangeStatusAppointmentDto } from './dto/change-status-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';

interface TimeWindowInput {
  startAt: string;
  durationMinutes?: number;
  endAt?: string;
}

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.PENDIENTE]: [
    AppointmentStatus.CONFIRMADO,
    AppointmentStatus.CANCELADO,
  ],
  [AppointmentStatus.CONFIRMADO]: [
    AppointmentStatus.ATENDIDO,
    AppointmentStatus.CANCELADO,
  ],
  [AppointmentStatus.ATENDIDO]: [],
  [AppointmentStatus.CANCELADO]: [],
};

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(Veterinarian)
    private readonly veterinariansRepository: Repository<Veterinarian>,
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const pet = await this.petsRepository.findOne({
      where: { id: dto.petId, active: true },
    });
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada o inactiva');
    }

    const veterinarian = await this.veterinariansRepository.findOne({
      where: { id: dto.veterinarianId, active: true },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado o inactivo');
    }

    const { startAt, endAt } = this.resolveWindow(dto);
    this.assertValidWindow(startAt, endAt);

    return this.dataSource.transaction(async (manager) => {
      await this.lockVeterinarian(manager, dto.veterinarianId);
      await this.lockPet(manager, dto.petId);
      await this.assertNoOverlap(manager, dto.veterinarianId, startAt, endAt);
      await this.assertNoPetOverlap(manager, dto.petId, startAt, endAt);

      const appointment = manager.create(Appointment, {
        petId: dto.petId,
        veterinarianId: dto.veterinarianId,
        startAt,
        endAt,
        reason: dto.reason,
        notes: dto.notes ?? null,
        status: AppointmentStatus.PENDIENTE,
      });
      return manager.save(appointment);
    });
  }

  async reschedule(
    id: number,
    dto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findEntity(id);
    const veterinarianId = dto.veterinarianId ?? appointment.veterinarianId;

    if (veterinarianId !== appointment.veterinarianId) {
      const veterinarian = await this.veterinariansRepository.findOne({
        where: { id: veterinarianId, active: true },
      });
      if (!veterinarian) {
        throw new NotFoundException('Veterinario no encontrado o inactivo');
      }
    }

    const { startAt, endAt } = this.resolveWindow(dto);
    this.assertValidWindow(startAt, endAt);

    return this.dataSource.transaction(async (manager) => {
      await this.lockVeterinarian(manager, veterinarianId);
      await this.lockPet(manager, appointment.petId);
      await this.assertNoOverlap(manager, veterinarianId, startAt, endAt, id);
      await this.assertNoPetOverlap(
        manager,
        appointment.petId,
        startAt,
        endAt,
        id,
      );

      appointment.veterinarianId = veterinarianId;
      appointment.startAt = startAt;
      appointment.endAt = endAt;
      return manager.save(appointment);
    });
  }

  async changeStatus(
    id: number,
    dto: ChangeStatusAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findEntity(id);
    const allowed = STATUS_TRANSITIONS[appointment.status];
    if (!allowed.includes(dto.status)) {
      throw new ConflictException(
        `No se puede pasar de ${appointment.status} a ${dto.status}`,
      );
    }
    appointment.status = dto.status;
    return this.appointmentsRepository.save(appointment);
  }

  async cancel(id: number): Promise<Appointment> {
    return this.changeStatus(id, { status: AppointmentStatus.CANCELADO });
  }

  async findAgenda(query: ListAppointmentsQueryDto): Promise<Appointment[]> {
    const qb = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .orderBy('appointment.startAt', 'ASC');

    if (query.veterinarianId) {
      qb.andWhere('appointment.veterinarianId = :veterinarianId', {
        veterinarianId: query.veterinarianId,
      });
    }

    if (query.petId) {
      qb.andWhere('appointment.petId = :petId', { petId: query.petId });
    }

    if (query.status) {
      qb.andWhere('appointment.status = :status', { status: query.status });
    }

    if (query.date) {
      const dayStart = new Date(`${query.date}T00:00:00`);
      const dayEnd = new Date(`${query.date}T23:59:59.999`);
      qb.andWhere('appointment.startAt BETWEEN :dayStart AND :dayEnd', {
        dayStart,
        dayEnd,
      });
    } else {
      if (query.from) {
        qb.andWhere('appointment.startAt >= :from', {
          from: new Date(query.from),
        });
      }
      if (query.to) {
        qb.andWhere('appointment.startAt <= :to', { to: new Date(query.to) });
      }
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    return this.findEntity(id);
  }

  private async findEntity(id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: { pet: true, veterinarian: true },
    });
    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }
    return appointment;
  }

  private resolveWindow(input: TimeWindowInput): {
    startAt: Date;
    endAt: Date;
  } {
    const startAt = new Date(input.startAt);
    if (input.endAt) {
      return { startAt, endAt: new Date(input.endAt) };
    }
    if (input.durationMinutes) {
      return {
        startAt,
        endAt: new Date(startAt.getTime() + input.durationMinutes * 60000),
      };
    }
    throw new BadRequestException(
      'Debe indicarse durationMinutes o endAt para calcular la duración del turno',
    );
  }

  private assertValidWindow(startAt: Date, endAt: Date): void {
    if (startAt.getTime() < Date.now()) {
      throw new ConflictException('No se puede crear un turno en el pasado');
    }
    if (endAt.getTime() <= startAt.getTime()) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior al inicio',
      );
    }
  }

  /**
   * Namespaces del advisory lock: `veterinarianId` y `petId` son secuencias
   * de PK independientes (ambas empiezan en 1), así que sin un namespace un
   * turno con id 1 de cada tabla compartiría la misma clave de lock.
   */
  private static readonly LOCK_NAMESPACE_VETERINARIAN = 1;
  private static readonly LOCK_NAMESPACE_PET = 2;

  /**
   * Advisory lock transaccional por veterinario (D2): serializa las
   * verificaciones de solapamiento del mismo profesional entre transacciones
   * concurrentes. Se libera solo al terminar la transacción (commit/rollback).
   */
  private async lockVeterinarian(
    manager: EntityManager,
    veterinarianId: number,
  ): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [
      AppointmentsService.LOCK_NAMESPACE_VETERINARIAN,
      veterinarianId,
    ]);
  }

  /** Mismo mecanismo que `lockVeterinarian`, pero por mascota: evita que una
   * misma mascota quede agendada dos veces en el mismo horario con
   * profesionales distintos. */
  private async lockPet(
    manager: EntityManager,
    petId: number,
  ): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [
      AppointmentsService.LOCK_NAMESPACE_PET,
      petId,
    ]);
  }

  private async assertNoOverlap(
    manager: EntityManager,
    veterinarianId: number,
    startAt: Date,
    endAt: Date,
    excludeId?: number,
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder(Appointment, 'appointment')
      .where('appointment.veterinarianId = :veterinarianId', {
        veterinarianId,
      })
      .andWhere('appointment.status != :cancelled', {
        cancelled: AppointmentStatus.CANCELADO,
      })
      .andWhere('appointment.startAt < :endAt', { endAt })
      .andWhere('appointment.endAt > :startAt', { startAt });

    if (excludeId) {
      qb.andWhere('appointment.id != :excludeId', { excludeId });
    }

    const overlapping = await qb.getCount();
    if (overlapping > 0) {
      throw new ConflictException(
        'El veterinario ya tiene un turno en ese horario',
      );
    }
  }

  private async assertNoPetOverlap(
    manager: EntityManager,
    petId: number,
    startAt: Date,
    endAt: Date,
    excludeId?: number,
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder(Appointment, 'appointment')
      .where('appointment.petId = :petId', { petId })
      .andWhere('appointment.status != :cancelled', {
        cancelled: AppointmentStatus.CANCELADO,
      })
      .andWhere('appointment.startAt < :endAt', { endAt })
      .andWhere('appointment.endAt > :startAt', { startAt });

    if (excludeId) {
      qb.andWhere('appointment.id != :excludeId', { excludeId });
    }

    const overlapping = await qb.getCount();
    if (overlapping > 0) {
      throw new ConflictException(
        'La mascota ya tiene un turno en ese horario',
      );
    }
  }
}
