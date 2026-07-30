import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from './entities/owner.entity';
import { Pet } from '../pets/entities/pet.entity';
import { calculatePetAge } from '../pets/utils/calculate-pet-age.util';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { ListOwnersQueryDto } from './dto/list-owners-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(Owner)
    private readonly ownersRepository: Repository<Owner>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
  ) {}

  async create(dto: CreateOwnerDto): Promise<Owner> {
    if (dto.document) {
      await this.assertDocumentAvailable(dto.document);
    }
    const owner = this.ownersRepository.create(dto);
    return this.ownersRepository.save(owner);
  }

  async findAll(query: ListOwnersQueryDto): Promise<PaginatedResult<Owner>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const active = query.active ?? true;

    const qb = this.ownersRepository
      .createQueryBuilder('owner')
      .where('owner.active = :active', { active });

    if (query.search) {
      qb.andWhere(
        '(owner.fullName ILIKE :search OR owner.phone ILIKE :search OR owner.document ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('owner.fullName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Owner> {
    const owner = await this.findEntity(id);
    const pets = await this.petsRepository.find({
      where: { ownerId: id, active: true },
      order: { name: 'ASC' },
    });
    owner.pets = pets.map((pet) => ({
      ...pet,
      age: calculatePetAge(pet.birthDate),
    }));
    return owner;
  }

  async update(id: number, dto: UpdateOwnerDto): Promise<Owner> {
    const owner = await this.findEntity(id);
    if (dto.document && dto.document !== owner.document) {
      await this.assertDocumentAvailable(dto.document);
    }
    Object.assign(owner, dto);
    return this.ownersRepository.save(owner);
  }

  async remove(id: number): Promise<void> {
    const owner = await this.findEntity(id);
    const activePetsCount = await this.petsRepository.count({
      where: { ownerId: id, active: true },
    });
    if (activePetsCount > 0) {
      throw new ConflictException(
        'No se puede dar de baja un dueño con mascotas activas',
      );
    }
    owner.active = false;
    await this.ownersRepository.save(owner);
  }

  private async findEntity(id: number): Promise<Owner> {
    const owner = await this.ownersRepository.findOne({
      where: { id, active: true },
    });
    if (!owner) {
      throw new NotFoundException('Dueño no encontrado');
    }
    return owner;
  }

  private async assertDocumentAvailable(document: string): Promise<void> {
    const existing = await this.ownersRepository.findOne({
      where: { document },
    });
    if (existing) {
      throw new ConflictException('Ya existe un dueño con ese documento');
    }
  }
}
