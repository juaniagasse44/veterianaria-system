import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { Veterinarian } from '../../veterinarians/entities/veterinarian.entity';

export enum AppointmentReason {
  CONSULTA = 'CONSULTA',
  CONTROL = 'CONTROL',
  VACUNACION = 'VACUNACION',
  CIRUGIA = 'CIRUGIA',
  OTRO = 'OTRO',
}

export enum AppointmentStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  ATENDIDO = 'ATENDIDO',
  CANCELADO = 'CANCELADO',
}

@Index('IDX_appointments_vet_start', ['veterinarianId', 'startAt'])
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_appointments_pet')
  @Column({ name: 'pet_id', type: 'int' })
  petId: number;

  @ManyToOne(() => Pet, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ name: 'veterinarian_id', type: 'int' })
  veterinarianId: number;

  @ManyToOne(() => Veterinarian, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @Column({ type: 'varchar', length: 30 })
  reason: AppointmentReason;

  @Index('IDX_appointments_status')
  @Column({ type: 'varchar', length: 20, default: AppointmentStatus.PENDIENTE })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update_date' })
  lastUpdateDate: Date;
}
