import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VaccinationsService } from './vaccinations.service';
import { Vaccination } from './entities/vaccination.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Product } from '../products/entities/product.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { StockService } from '../stock/stock.service';
import { StockMovementType } from '../stock/entities/stock-movement.entity';

type FindOneEntity = typeof Veterinarian | typeof Product;

interface FakeManager {
  findOne: jest.Mock<
    Promise<Partial<Veterinarian> | Partial<Product> | null>,
    [FindOneEntity, object?]
  >;
  create: jest.Mock<
    Record<string, unknown>,
    [unknown, Record<string, unknown>]
  >;
  save: jest.Mock<Promise<Record<string, unknown>>, [Record<string, unknown>]>;
}

function buildManager(options: {
  veterinarian?: Partial<Veterinarian> | null;
  product?: Partial<Product> | null;
}): FakeManager {
  const veterinarian: Partial<Veterinarian> | null =
    'veterinarian' in options
      ? (options.veterinarian ?? null)
      : { id: 1, active: true };

  return {
    findOne: jest.fn<
      Promise<Partial<Veterinarian> | Partial<Product> | null>,
      [FindOneEntity, object?]
    >((entity) => {
      if (entity === Veterinarian) return Promise.resolve(veterinarian);
      if (entity === Product) return Promise.resolve(options.product ?? null);
      return Promise.resolve(null);
    }),
    create: jest.fn<
      Record<string, unknown>,
      [unknown, Record<string, unknown>]
    >((_entity, data) => data),
    save: jest.fn<Promise<Record<string, unknown>>, [Record<string, unknown>]>(
      (entity) => Promise.resolve({ id: 1, ...entity }),
    ),
  };
}

describe('VaccinationsService', () => {
  let service: VaccinationsService;
  type TransactionMock = jest.Mock<
    Promise<unknown>,
    [(manager: FakeManager) => Promise<unknown>]
  >;
  let dataSource: { transaction: TransactionMock };
  let petsRepository: { findOne: jest.Mock };
  let stockService: { applyMovement: jest.Mock };

  const activePet: Pet = { id: 1, active: true } as Pet;

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn<
        Promise<unknown>,
        [(manager: FakeManager) => Promise<unknown>]
      >(),
    };
    petsRepository = { findOne: jest.fn().mockResolvedValue(activePet) };
    stockService = {
      applyMovement: jest.fn().mockResolvedValue({ quantity: 9 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        VaccinationsService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Vaccination), useValue: {} },
        { provide: getRepositoryToken(Pet), useValue: petsRepository },
        { provide: StockService, useValue: stockService },
      ],
    }).compile();

    service = moduleRef.get(VaccinationsService);
  });

  it('404 si la mascota no existe o está inactiva (no abre transacción)', async () => {
    petsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({ petId: 999, vaccineName: 'X' }),
    ).rejects.toThrow(NotFoundException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('con producto que lleva stock, descuenta 1 unidad con la referencia VACCINE', async () => {
    const manager = buildManager({ product: { id: 4, trackStock: true } });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.create({
      petId: 1,
      vaccineName: 'Antirrábica',
      productId: 4,
    });

    expect(stockService.applyMovement).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        productId: 4,
        quantity: -1,
        type: StockMovementType.SALE,
        referenceType: 'VACCINE',
        referenceId: result.id,
      }),
    );
  });

  it('con producto que NO lleva stock, no descuenta nada', async () => {
    const manager = buildManager({ product: { id: 4, trackStock: false } });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.create({
      petId: 1,
      vaccineName: 'Antirrábica',
      productId: 4,
    });

    expect(stockService.applyMovement).not.toHaveBeenCalled();
  });

  it('sin producto asociado, no toca stock (D1)', async () => {
    const manager = buildManager({});
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.create({ petId: 1, vaccineName: 'Antiparasitaria' });

    expect(stockService.applyMovement).not.toHaveBeenCalled();
  });

  it('404 si el producto asociado no existe/está inactivo', async () => {
    const manager = buildManager({ product: null });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.create({ petId: 1, vaccineName: 'X', productId: 999 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('404 si el veterinario indicado no existe/está inactivo', async () => {
    const manager = buildManager({ veterinarian: null });
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.create({ petId: 1, vaccineName: 'X', veterinarianId: 999 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('calcula next_dose_date a partir de validDays', async () => {
    const manager = buildManager({});
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.create({
      petId: 1,
      vaccineName: 'Antirrábica',
      appliedDate: '2026-01-01',
      validDays: 365,
    });

    expect(result.nextDoseDate).toBe('2027-01-01');
  });

  it('usa nextDoseDate directo si se especifica (ignora validDays)', async () => {
    const manager = buildManager({});
    dataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.create({
      petId: 1,
      vaccineName: 'Antirrábica',
      appliedDate: '2026-01-01',
      nextDoseDate: '2026-06-01',
      validDays: 365,
    });

    expect(result.nextDoseDate).toBe('2026-06-01');
  });
});
