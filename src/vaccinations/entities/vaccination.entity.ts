import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { Product } from '../../products/entities/product.entity';
import { Veterinarian } from '../../veterinarians/entities/veterinarian.entity';

@Index('IDX_vaccinations_pet', ['petId', 'appliedDate'])
@Entity('vaccinations')
export class Vaccination {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pet_id', type: 'int' })
  petId: number;

  @ManyToOne(() => Pet, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ name: 'product_id', type: 'int', nullable: true })
  productId: number | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column({ name: 'vaccine_name', type: 'varchar', length: 150 })
  vaccineName: string;

  @Column({ name: 'applied_date', type: 'date', default: () => 'now()' })
  appliedDate: string;

  @Index('IDX_vaccinations_next_dose')
  @Column({ name: 'next_dose_date', type: 'date', nullable: true })
  nextDoseDate: string | null;

  @Column({ name: 'veterinarian_id', type: 'int', nullable: true })
  veterinarianId: number | null;

  @ManyToOne(() => Veterinarian, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;
}
