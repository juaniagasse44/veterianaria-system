import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from './entities/owner.entity';
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
    const owner = await this.ownersRepository.findOne({
      where: { id, active: true },
    });
    if (!owner) {
      throw new NotFoundException('Dueño no encontrado');
    }
    return owner;
  }

  async update(id: number, dto: UpdateOwnerDto): Promise<Owner> {
    const owner = await this.findOne(id);
    if (dto.document && dto.document !== owner.document) {
      await this.assertDocumentAvailable(dto.document);
    }
    Object.assign(owner, dto);
    return this.ownersRepository.save(owner);
  }

  async remove(id: number): Promise<void> {
    const owner = await this.findOne(id);
    owner.active = false;
    await this.ownersRepository.save(owner);
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
