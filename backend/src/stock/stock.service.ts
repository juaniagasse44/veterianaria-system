import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { StockLevel } from './entities/stock-level.entity';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';

export interface ApplyMovementInput {
  productId: number;
  quantity: number;
  type: StockMovementType;
  unitCost?: number | null;
  referenceType?: string | null;
  referenceId?: number | null;
  notes?: string | null;
  allowNegativeStock?: boolean;
}

export interface ProductValuationItem {
  productId: number;
  productName: string;
  quantity: number;
  cost: number;
  value: number;
}

export interface ValuationResult {
  total: number;
  items: ProductValuationItem[];
}

@Injectable()
export class StockService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(StockLevel)
    private readonly stockLevelsRepository: Repository<StockLevel>,
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /**
   * Descuenta/ingresa stock de forma atómica. Recibe el EntityManager de una
   * transacción externa para poder componerse con otras operaciones (ej.
   * aplicar una vacuna y descontar stock en la misma transacción, P2-03).
   * Usa SELECT ... FOR UPDATE sobre stock_levels para serializar movimientos
   * concurrentes del mismo producto (D2).
   */
  /**
   * SELECT ... FOR UPDATE sobre stock_levels del producto (crea la fila si no
   * existe). Volver a llamarla dentro de la misma transacción sobre el mismo
   * producto es seguro: Postgres ya tiene la fila bloqueada por esa transacción.
   */
  private async getLockedLevel(
    manager: EntityManager,
    productId: number,
  ): Promise<StockLevel> {
    let level = await manager
      .createQueryBuilder(StockLevel, 'level')
      .setLock('pessimistic_write')
      .where('level.productId = :productId', { productId })
      .getOne();

    if (!level) {
      await manager
        .createQueryBuilder()
        .insert()
        .into(StockLevel)
        .values({ productId, quantity: 0, minQuantity: 0 })
        .orIgnore()
        .execute();

      level = await manager
        .createQueryBuilder(StockLevel, 'level')
        .setLock('pessimistic_write')
        .where('level.productId = :productId', { productId })
        .getOne();
    }

    if (!level) {
      throw new ConflictException('No se pudo obtener el nivel de stock');
    }

    return level;
  }

  async applyMovement(
    manager: EntityManager,
    input: ApplyMovementInput,
  ): Promise<StockLevel | null> {
    const product = await manager.findOne(Product, {
      where: { id: input.productId },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    if (!product.trackStock) {
      return null;
    }

    const level = await this.getLockedLevel(manager, input.productId);

    const newQuantity = Number(level.quantity) + input.quantity;
    const allowNegativeStock = input.allowNegativeStock ?? true;
    if (newQuantity < 0 && !allowNegativeStock) {
      throw new ConflictException('Stock insuficiente para la operación');
    }

    const movement = manager.create(StockMovement, {
      productId: input.productId,
      quantity: input.quantity,
      type: input.type,
      unitCost: input.unitCost ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
    });
    await manager.save(movement);

    level.quantity = newQuantity;
    await manager.save(level);

    return level;
  }

  async setInitialStock(
    productId: number,
    quantity: number,
    notes?: string,
    minQuantity?: number,
  ): Promise<StockLevel> {
    return this.dataSource.transaction(async (manager) => {
      const level = await this.applyMovement(manager, {
        productId,
        quantity,
        type: StockMovementType.INITIAL,
        notes,
      });
      if (!level) {
        throw new ConflictException('El producto no lleva control de stock');
      }
      if (minQuantity !== undefined) {
        level.minQuantity = minQuantity;
        await manager.save(level);
      }
      return level;
    });
  }

  async adjust(
    productId: number,
    newQuantity: number,
    notes?: string,
    minQuantity?: number,
  ): Promise<StockLevel> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }
      if (!product.trackStock) {
        throw new ConflictException('El producto no lleva control de stock');
      }

      // Se bloquea la fila antes de calcular la diferencia: si dos ajustes
      // llegan a la vez, el segundo espera el lock y recalcula sobre el valor
      // ya actualizado por el primero (evita perder el ajuste concurrente).
      const current = await this.getLockedLevel(manager, productId);
      const diff = newQuantity - Number(current.quantity);

      const level = await this.applyMovement(manager, {
        productId,
        quantity: diff,
        type: StockMovementType.ADJUSTMENT,
        notes,
      });
      if (!level) {
        throw new ConflictException('El producto no lleva control de stock');
      }
      if (minQuantity !== undefined) {
        level.minQuantity = minQuantity;
        await manager.save(level);
      }
      return level;
    });
  }

  async getLevel(productId: number): Promise<StockLevel> {
    const level = await this.stockLevelsRepository.findOne({
      where: { productId },
      relations: { product: true },
    });
    if (!level) {
      throw new NotFoundException('El producto no tiene stock cargado');
    }
    return level;
  }

  async listLevels(): Promise<StockLevel[]> {
    return this.stockLevelsRepository.find({
      relations: { product: true },
      order: { product: { name: 'ASC' } },
    });
  }

  async listLowStock(): Promise<StockLevel[]> {
    return this.stockLevelsRepository
      .createQueryBuilder('level')
      .leftJoinAndSelect('level.product', 'product')
      .where('level.quantity <= level.minQuantity')
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  async valuation(): Promise<ValuationResult> {
    const levels = await this.stockLevelsRepository.find({
      relations: { product: true },
    });

    let total = 0;
    const items = levels.map((level) => {
      const quantity = Number(level.quantity);
      const cost = Number(level.product.cost);
      const value = quantity * cost;
      total += value;
      return {
        productId: level.productId,
        productName: level.product.name,
        quantity,
        cost,
        value,
      };
    });

    return { total, items };
  }

  async listMovements(productId?: number): Promise<StockMovement[]> {
    const qb = this.stockMovementsRepository
      .createQueryBuilder('movement')
      .orderBy('movement.creationDate', 'DESC');

    if (productId) {
      qb.andWhere('movement.productId = :productId', { productId });
    }

    return qb.getMany();
  }
}
