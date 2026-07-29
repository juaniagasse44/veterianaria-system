import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { ListVeterinariansQueryDto } from './dto/list-veterinarians-query.dto';
import { PaginatedResult } from '../owners/owners.service';

@Injectable()
export class VeterinariansService {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinariansRepository: Repository<Veterinarian>,
  ) {}

  async create(dto: CreateVeterinarianDto): Promise<Veterinarian> {
    if (dto.licenseNumber) {
      await this.assertLicenseAvailable(dto.licenseNumber);
    }
    const veterinarian = this.veterinariansRepository.create(dto);
    return this.veterinariansRepository.save(veterinarian);
  }

  async findAll(
    query: ListVeterinariansQueryDto,
  ): Promise<PaginatedResult<Veterinarian>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const active = query.active ?? true;

    const qb = this.veterinariansRepository
      .createQueryBuilder('veterinarian')
      .where('veterinarian.active = :active', { active });

    if (query.search) {
      qb.andWhere(
        '(veterinarian.fullName ILIKE :search OR veterinarian.specialty ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('veterinarian.fullName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Veterinarian> {
    const veterinarian = await this.veterinariansRepository.findOne({
      where: { id, active: true },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }
    return veterinarian;
  }

  async update(id: number, dto: UpdateVeterinarianDto): Promise<Veterinarian> {
    const veterinarian = await this.findOne(id);
    if (dto.licenseNumber && dto.licenseNumber !== veterinarian.licenseNumber) {
      await this.assertLicenseAvailable(dto.licenseNumber);
    }
    Object.assign(veterinarian, dto);
    return this.veterinariansRepository.save(veterinarian);
  }

  async remove(id: number): Promise<void> {
    const veterinarian = await this.findOne(id);
    veterinarian.active = false;
    await this.veterinariansRepository.save(veterinarian);
  }

  private async assertLicenseAvailable(licenseNumber: string): Promise<void> {
    const existing = await this.veterinariansRepository.findOne({
      where: { licenseNumber },
    });
    if (existing) {
      throw new ConflictException('Ya existe un veterinario con esa matrícula');
    }
  }
}
