import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';

@Entity('owners')
export class Owner {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_owners_full_name')
  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Index('UQ_owners_document', { unique: true, where: 'document IS NOT NULL' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  document: string | null;

  @Index('IDX_owners_phone')
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update_date' })
  lastUpdateDate: Date;

  @OneToMany(() => Pet, (pet) => pet.owner)
  pets: Pet[];
}
