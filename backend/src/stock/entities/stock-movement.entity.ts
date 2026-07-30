import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Product } from '../../products/entities/product.entity';

export enum StockMovementType {
  INITIAL = 'INITIAL',
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}

@Index('IDX_movements_reference', ['referenceType', 'referenceId'])
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_movements_product')
  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 4,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({ type: 'varchar', length: 20 })
  type: StockMovementType;

  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 20,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer,
  })
  unitCost: number | null;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;
}
