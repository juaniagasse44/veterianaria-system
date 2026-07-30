import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vaccination } from './entities/vaccination.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Product } from '../products/entities/product.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { StockService } from '../stock/stock.service';
import { StockMovementType } from '../stock/entities/stock-movement.entity';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { ListVaccinationsQueryDto } from './dto/list-vaccinations-query.dto';
import { PaginatedResult } from '../owners/owners.service';

const RELATIONS = { pet: true, product: true, veterinarian: true };

@Injectable()
export class VaccinationsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Vaccination)
    private readonly vaccinationsRepository: Repository<Vaccination>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    private readonly stockService: StockService,
  ) {}

  async create(dto: CreateVaccinationDto): Promise<Vaccination> {
    const pet = await this.petsRepository.findOne({
      where: { id: dto.petId, active: true },
    });
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada o inactiva');
    }

    const appliedDate = dto.appliedDate
      ? new Date(dto.appliedDate)
      : new Date();
    const nextDoseDate = this.resolveNextDoseDate(appliedDate, dto);

    return this.dataSource.transaction(async (manager) => {
      if (dto.veterinarianId) {
        const veterinarian = await manager.findOne(Veterinarian, {
          where: { id: dto.veterinarianId, active: true },
        });
        if (!veterinarian) {
          throw new NotFoundException('Veterinario no encontrado o inactivo');
        }
      }

      let product: Product | null = null;
      if (dto.productId) {
        product = await manager.findOne(Product, {
          where: { id: dto.productId, active: true },
        });
        if (!product) {
          throw new NotFoundException('Producto no encontrado o inactivo');
        }
      }

      const vaccination = manager.create(Vaccination, {
        petId: dto.petId,
        productId: dto.productId ?? null,
        vaccineName: dto.vaccineName,
        appliedDate: this.toDateOnly(appliedDate),
        nextDoseDate: nextDoseDate ? this.toDateOnly(nextDoseDate) : null,
        veterinarianId: dto.veterinarianId ?? null,
        notes: dto.notes ?? null,
      });
      const saved = await manager.save(vaccination);

      // Descuento de stock atómico (D2): si el producto lleva stock, resta 1
      // unidad en la misma transacción y deja la traza VACCINE -> vaccination.id.
      if (product && product.trackStock) {
        await this.stockService.applyMovement(manager, {
          productId: product.id,
          quantity: -1,
          type: StockMovementType.SALE,
          referenceType: 'VACCINE',
          referenceId: saved.id,
        });
      }

      return saved;
    });
  }

  async findAll(
    query: ListVaccinationsQueryDto,
  ): Promise<PaginatedResult<Vaccination>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.vaccinationsRepository
      .createQueryBuilder('vaccination')
      .leftJoinAndSelect('vaccination.pet', 'pet')
      .leftJoinAndSelect('vaccination.product', 'product')
      .leftJoinAndSelect('vaccination.veterinarian', 'veterinarian')
      .orderBy('vaccination.appliedDate', 'DESC');

    if (query.petId) {
      qb.andWhere('vaccination.petId = :petId', { petId: query.petId });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findUpcoming(days: number): Promise<Vaccination[]> {
    const today = this.toDateOnly(new Date());
    const limitDate = this.toDateOnly(
      new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    );

    return this.vaccinationsRepository
      .createQueryBuilder('vaccination')
      .leftJoinAndSelect('vaccination.pet', 'pet')
      .where('vaccination.nextDoseDate IS NOT NULL')
      .andWhere('vaccination.nextDoseDate BETWEEN :today AND :limitDate', {
        today,
        limitDate,
      })
      .orderBy('vaccination.nextDoseDate', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Vaccination> {
    const vaccination = await this.vaccinationsRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!vaccination) {
      throw new NotFoundException('Vacuna no encontrada');
    }
    return vaccination;
  }

  private resolveNextDoseDate(
    appliedDate: Date,
    dto: Pick<CreateVaccinationDto, 'nextDoseDate' | 'validDays'>,
  ): Date | null {
    if (dto.nextDoseDate) {
      return new Date(dto.nextDoseDate);
    }
    if (dto.validDays) {
      return new Date(
        appliedDate.getTime() + dto.validDays * 24 * 60 * 60 * 1000,
      );
    }
    return null;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
