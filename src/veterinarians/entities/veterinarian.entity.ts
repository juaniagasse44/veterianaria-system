import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('veterinarians')
export class Veterinarian {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_veterinarians_full_name')
  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Index('UQ_veterinarians_license', {
    unique: true,
    where: 'license_number IS NOT NULL',
  })
  @Column({
    name: 'license_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  licenseNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialty: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update_date' })
  lastUpdateDate: Date;
}
