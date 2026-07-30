import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { Pet } from '../pets/entities/pet.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ListConsultationsQueryDto } from './dto/list-consultations-query.dto';
import { PaginatedResult } from '../owners/owners.service';

const RELATIONS = { pet: true, appointment: true, veterinarian: true };

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
  ) {}

  async create(dto: CreateConsultationDto): Promise<Consultation> {
    const pet = await this.petsRepository.findOne({
      where: { id: dto.petId, active: true },
    });
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada o inactiva');
    }

    return this.dataSource.transaction(async (manager) => {
      let veterinarianId = dto.veterinarianId ?? null;

      if (dto.appointmentId) {
        const appointment = await manager.findOne(Appointment, {
          where: { id: dto.appointmentId },
        });
        if (!appointment) {
          throw new NotFoundException('Turno no encontrado');
        }
        if (appointment.petId !== dto.petId) {
          throw new ConflictException(
            'El turno indicado no corresponde a esta mascota',
          );
        }
        if (appointment.status === AppointmentStatus.CANCELADO) {
          throw new ConflictException(
            'No se puede registrar una consulta de un turno cancelado',
          );
        }

        veterinarianId = veterinarianId ?? appointment.veterinarianId;

        // Registrar la consulta es la señal clínica de que el turno ocurrió:
        // pasa a ATENDIDO sin importar si estaba PENDIENTE o CONFIRMADO (D2).
        if (appointment.status !== AppointmentStatus.ATENDIDO) {
          appointment.status = AppointmentStatus.ATENDIDO;
          await manager.save(appointment);
        }
      }

      if (veterinarianId) {
        const veterinarian = await manager.findOne(Veterinarian, {
          where: { id: veterinarianId, active: true },
        });
        if (!veterinarian) {
          throw new NotFoundException('Veterinario no encontrado o inactivo');
        }
      }

      if (dto.weight !== undefined) {
        await manager.update(Pet, { id: dto.petId }, { weight: dto.weight });
      }

      const consultation = manager.create(Consultation, {
        petId: dto.petId,
        appointmentId: dto.appointmentId ?? null,
        veterinarianId,
        reason: dto.reason ?? null,
        diagnosis: dto.diagnosis ?? null,
        treatment: dto.treatment ?? null,
        weight: dto.weight ?? null,
        notes: dto.notes ?? null,
      });
      return manager.save(consultation);
    });
  }

  async findAll(
    query: ListConsultationsQueryDto,
  ): Promise<PaginatedResult<Consultation>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.consultationsRepository
      .createQueryBuilder('consultation')
      .orderBy('consultation.consultationDate', 'DESC');

    if (query.petId) {
      qb.andWhere('consultation.petId = :petId', { petId: query.petId });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findByPet(petId: number): Promise<Consultation[]> {
    const pet = await this.petsRepository.findOne({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }
    return this.consultationsRepository.find({
      where: { petId },
      relations: RELATIONS,
      order: { consultationDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Consultation> {
    return this.findEntity(id);
  }

  async update(id: number, dto: UpdateConsultationDto): Promise<Consultation> {
    const consultation = await this.findEntity(id);
    Object.assign(consultation, dto);
    return this.consultationsRepository.save(consultation);
  }

  private async findEntity(id: number): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }
    return consultation;
  }
}
