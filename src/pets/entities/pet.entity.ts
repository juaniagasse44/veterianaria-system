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
import { Owner } from '../../owners/entities/owner.entity';

export enum PetSpecies {
  PERRO = 'PERRO',
  GATO = 'GATO',
  AVE = 'AVE',
  ROEDOR = 'ROEDOR',
  REPTIL = 'REPTIL',
  OTRO = 'OTRO',
}

export enum PetSex {
  MACHO = 'MACHO',
  HEMBRA = 'HEMBRA',
  DESCONOCIDO = 'DESCONOCIDO',
}

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_pets_owner')
  @Column({ name: 'owner_id', type: 'int' })
  ownerId: number;

  @ManyToOne(() => Owner, (owner) => owner.pets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @Index('IDX_pets_name')
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  species: PetSpecies;

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sex: PetSex | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: string | null;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 3,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) =>
        value === null || value === undefined ? null : parseFloat(value),
    },
  })
  weight: number | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update_date' })
  lastUpdateDate: Date;
}
