import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import { PaginatedResult } from '../owners/owners.service';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
  ) {}

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async findAll(
    query: ListProductCategoriesQueryDto,
  ): Promise<PaginatedResult<ProductCategory>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const active = query.active ?? true;

    const qb = this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.active = :active', { active });

    if (query.search) {
      qb.andWhere('category.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('category.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<ProductCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id, active: true },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async update(
    id: number,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    category.active = false;
    await this.categoriesRepository.save(category);
  }
}
