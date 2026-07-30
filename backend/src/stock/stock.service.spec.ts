import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { StockService } from './stock.service';
import { StockLevel } from './entities/stock-level.entity';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';

type FakeLevel = Partial<StockLevel>;

interface FakeQueryBuilder {
  setLock: jest.Mock<FakeQueryBuilder, [string]>;
  where: jest.Mock<FakeQueryBuilder, [string, object?]>;
  getOne: jest.Mock<Promise<FakeLevel | null>, []>;
  insert: jest.Mock<FakeQueryBuilder, []>;
  into: jest.Mock<FakeQueryBuilder, [unknown]>;
  values: jest.Mock<FakeQueryBuilder, [Record<string, unknown>]>;
  orIgnore: jest.Mock<FakeQueryBuilder, []>;
  execute: jest.Mock<Promise<void>, []>;
}

interface FakeManager {
  findOne: jest.Mock<Promise<Partial<Product> | null>, unknown[]>;
  createQueryBuilder: jest.Mock<FakeQueryBuilder, unknown[]>;
  create: jest.Mock<
    Record<string, unknown>,
    [unknown, Record<string, unknown>]
  >;
  save: jest.Mock<Promise<unknown>, [unknown]>;
  qb: FakeQueryBuilder;
}

/**
 * Simula un EntityManager transaccional de TypeORM lo suficiente como para
 * ejercitar getLockedLevel/applyMovement: createQueryBuilder siempre devuelve
 * el mismo builder encadenable, y getOne() refleja el estado mutable de
 * `levelRow` (incluida la fila creada por el INSERT ... ON CONFLICT).
 */
function buildManager(options: {
  product: Partial<Product> | null;
  initialLevel: FakeLevel | null;
}): FakeManager {
  let levelRow: FakeLevel | null = options.initialLevel
    ? { ...options.initialLevel }
    : null;

  const qb = {} as FakeQueryBuilder;
  qb.setLock = jest.fn<FakeQueryBuilder, [string]>().mockReturnValue(qb);
  qb.where = jest.fn<FakeQueryBuilder, [string, object?]>().mockReturnValue(qb);
  qb.getOne = jest.fn<Promise<FakeLevel | null>, []>(() =>
    Promise.resolve(levelRow),
  );
  qb.insert = jest.fn<FakeQueryBuilder, []>().mockReturnValue(qb);
  qb.into = jest.fn<FakeQueryBuilder, [unknown]>().mockReturnValue(qb);
  qb.values = jest.fn<FakeQueryBuilder, [Record<string, unknown>]>((v) => {
    levelRow = { id: 1, ...v };
    return qb;
  });
  qb.orIgnore = jest.fn<FakeQueryBuilder, []>().mockReturnValue(qb);
  qb.execute = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);

  return {
    findOne: jest
      .fn<Promise<Partial<Product> | null>, unknown[]>()
      .mockResolvedValue(options.product),
    createQueryBuilder: jest
      .fn<FakeQueryBuilder, unknown[]>()
      .mockReturnValue(qb),
    create: jest.fn<
      Record<string, unknown>,
      [unknown, Record<string, unknown>]
    >((_entity, data) => data),
    save: jest.fn<Promise<unknown>, [unknown]>((entity) =>
      Promise.resolve(entity),
    ),
    qb,
  };
}

describe('StockService', () => {
  let service: StockService;
  type TransactionMock = jest.Mock<
    Promise<unknown>,
    [(manager: FakeManager) => Promise<unknown>]
  >;
  let dataSource: { transaction: TransactionMock };

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn<
        Promise<unknown>,
        [(manager: FakeManager) => Promise<unknown>]
      >(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(StockLevel), useValue: {} },
        { provide: getRepositoryToken(StockMovement), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(StockService);
  });

  describe('applyMovement', () => {
    it('404 si el producto no existe', async () => {
      const manager = buildManager({ product: null, initialLevel: null });

      await expect(
        service.applyMovement(manager as unknown as EntityManager, {
          productId: 1,
          quantity: -1,
          type: StockMovementType.SALE,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('no genera movimiento ni nivel si el producto no lleva stock (track_stock=false)', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: false },
        initialLevel: null,
      });

      const result = await service.applyMovement(
        manager as unknown as EntityManager,
        {
          productId: 1,
          quantity: -1,
          type: StockMovementType.SALE,
        },
      );

      expect(result).toBeNull();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('crea la fila de nivel si no existe y aplica el movimiento inicial', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: true },
        initialLevel: null,
      });

      const result = await service.applyMovement(
        manager as unknown as EntityManager,
        {
          productId: 1,
          quantity: 50,
          type: StockMovementType.INITIAL,
        },
      );

      expect(result?.quantity).toBe(50);
      expect(manager.qb.values).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 1, quantity: 0 }),
      );
    });

    it('descuenta correctamente sobre un nivel existente', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: true },
        initialLevel: { id: 1, productId: 1, quantity: 10, minQuantity: 0 },
      });

      const result = await service.applyMovement(
        manager as unknown as EntityManager,
        {
          productId: 1,
          quantity: -3,
          type: StockMovementType.SALE,
        },
      );

      expect(result?.quantity).toBe(7);
    });

    it('permite stock negativo por defecto (D3)', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: true },
        initialLevel: { id: 1, productId: 1, quantity: 2, minQuantity: 0 },
      });

      const result = await service.applyMovement(
        manager as unknown as EntityManager,
        {
          productId: 1,
          quantity: -5,
          type: StockMovementType.SALE,
        },
      );

      expect(result?.quantity).toBe(-3);
    });

    it('rechaza si quedaría negativo y allowNegativeStock=false', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: true },
        initialLevel: { id: 1, productId: 1, quantity: 2, minQuantity: 0 },
      });

      await expect(
        service.applyMovement(manager as unknown as EntityManager, {
          productId: 1,
          quantity: -5,
          type: StockMovementType.SALE,
          allowNegativeStock: false,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('registra el movimiento con la referencia (reference_type/reference_id)', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: true },
        initialLevel: { id: 1, productId: 1, quantity: 10, minQuantity: 0 },
      });

      await service.applyMovement(manager as unknown as EntityManager, {
        productId: 1,
        quantity: -1,
        type: StockMovementType.SALE,
        referenceType: 'VACCINE',
        referenceId: 42,
      });

      expect(manager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({
          productId: 1,
          quantity: -1,
          type: StockMovementType.SALE,
          referenceType: 'VACCINE',
          referenceId: 42,
        }),
      );
    });

    it('invariante: el nivel final es la suma de los movimientos aplicados en secuencia', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: true },
        initialLevel: { id: 1, productId: 1, quantity: 0, minQuantity: 0 },
      });

      const deltas = [50, -3, -2, 10, -1];
      let last: StockLevel | null = null;
      for (const quantity of deltas) {
        last = await service.applyMovement(
          manager as unknown as EntityManager,
          {
            productId: 1,
            quantity,
            type: StockMovementType.ADJUSTMENT,
          },
        );
      }

      expect(last?.quantity).toBe(deltas.reduce((a, b) => a + b, 0));
    });
  });

  describe('adjust', () => {
    it('genera un movimiento por la diferencia entre el nivel actual y el objetivo', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: true },
        initialLevel: { id: 1, productId: 1, quantity: 50, minQuantity: 0 },
      });
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      const result = await service.adjust(1, 45, 'conteo físico');

      expect(result.quantity).toBe(45);
      expect(manager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({
          quantity: -5,
          type: StockMovementType.ADJUSTMENT,
        }),
      );
    });

    it('rechaza el ajuste si el producto no lleva stock', async () => {
      const manager = buildManager({
        product: { id: 1, trackStock: false },
        initialLevel: null,
      });
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      await expect(service.adjust(1, 10)).rejects.toThrow(ConflictException);
    });
  });
});
