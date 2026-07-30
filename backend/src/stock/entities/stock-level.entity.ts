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
import { Product } from '../../products/entities/product.entity';

@Entity('stock_levels')
export class StockLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('UQ_stock_levels_product', { unique: true })
  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({
    name: 'min_quantity',
    type: 'decimal',
    precision: 14,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  minQuantity: number;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update_date' })
  lastUpdateDate: Date;
}
