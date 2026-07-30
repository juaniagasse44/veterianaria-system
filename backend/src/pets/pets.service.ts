import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { Owner } from '../owners/entities/owner.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { ListPetsQueryDto } from './dto/list-pets-query.dto';
import { calculatePetAge, PetAge } from './utils/calculate-pet-age.util';
import { PaginatedResult } from '../owners/owners.service';

export type PetWithAge = Pet & { age: PetAge | null };

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(Owner)
    private readonly ownersRepository: Repository<Owner>,
  ) {}

  async create(dto: CreatePetDto): Promise<PetWithAge> {
    const owner = await this.ownersRepository.findOne({
      where: { id: dto.ownerId, active: true },
    });
    if (!owner) {
      throw new NotFoundException('Dueño no encontrado o inactivo');
    }
    const pet = this.petsRepository.create(dto);
    const saved = await this.petsRepository.save(pet);
    return this.toResponse(saved);
  }

  async findAll(query: ListPetsQueryDto): Promise<PaginatedResult<PetWithAge>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const active = query.active ?? true;

    const qb = this.petsRepository
      .createQueryBuilder('pet')
      .where('pet.active = :active', { active });

    if (query.ownerId) {
      qb.andWhere('pet.ownerId = :ownerId', { ownerId: query.ownerId });
    }

    if (query.species) {
      qb.andWhere('pet.species = :species', { species: query.species });
    }

    if (query.search) {
      qb.andWhere('pet.name ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy('pet.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map((pet) => this.toResponse(pet)),
      total,
      page,
      limit,
    };
  }

  async findByOwner(ownerId: number): Promise<PetWithAge[]> {
    const pets = await this.petsRepository.find({
      where: { ownerId, active: true },
      order: { name: 'ASC' },
    });
    return pets.map((pet) => this.toResponse(pet));
  }

  async findOne(id: number): Promise<PetWithAge> {
    const pet = await this.findEntity(id);
    return this.toResponse(pet);
  }

  async update(id: number, dto: UpdatePetDto): Promise<PetWithAge> {
    const pet = await this.findEntity(id);
    Object.assign(pet, dto);
    const saved = await this.petsRepository.save(pet);
    return this.toResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const pet = await this.findEntity(id);
    pet.active = false;
    await this.petsRepository.save(pet);
  }

  private async findEntity(id: number): Promise<Pet> {
    const pet = await this.petsRepository.findOne({
      where: { id, active: true },
      relations: { owner: true },
    });
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }
    return pet;
  }

  private toResponse(pet: Pet): PetWithAge {
    return { ...pet, age: calculatePetAge(pet.birthDate) };
  }
}
