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
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Pet } from '../../pets/entities/pet.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Veterinarian } from '../../veterinarians/entities/veterinarian.entity';

@Index('IDX_consultations_pet', ['petId', 'consultationDate'])
@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pet_id', type: 'int' })
  petId: number;

  @ManyToOne(() => Pet, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Index('IDX_consultations_appointment')
  @Column({ name: 'appointment_id', type: 'int', nullable: true })
  appointmentId: number | null;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;

  @Column({ name: 'veterinarian_id', type: 'int', nullable: true })
  veterinarianId: number | null;

  @ManyToOne(() => Veterinarian, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian | null;

  @Column({
    name: 'consultation_date',
    type: 'timestamptz',
    default: () => 'now()',
  })
  consultationDate: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  diagnosis: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  treatment: string | null;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 3,
    nullable: true,
    transformer: decimalTransformer,
  })
  weight: number | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update_date' })
  lastUpdateDate: Date;
}
