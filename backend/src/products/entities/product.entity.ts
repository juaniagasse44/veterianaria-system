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
import { ProductCategory } from './product-category.entity';

export enum ProductUnit {
  UNIDAD = 'UNIDAD',
  KG = 'KG',
  LT = 'LT',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => ProductCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory | null;

  @Index('UQ_products_sku', { unique: true, where: 'sku IS NOT NULL' })
  @Column({ type: 'varchar', length: 60, nullable: true })
  sku: string | null;

  @Index('IDX_products_barcode')
  @Column({ type: 'varchar', length: 64, nullable: true })
  barcode: string | null;

  @Index('IDX_products_name')
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({
    name: 'sale_price',
    type: 'decimal',
    precision: 20,
    scale: 6,
    transformer: decimalTransformer,
  })
  salePrice: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 6,
    default: 0,
    transformer: decimalTransformer,
  })
  cost: number;

  @Column({
    name: 'vat_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  vatRate: number | null;

  @Column({ type: 'varchar', length: 20, default: ProductUnit.UNIDAD })
  unit: ProductUnit;

  @Column({ name: 'track_stock', type: 'boolean', default: true })
  trackStock: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update_date' })
  lastUpdateDate: Date;
}
