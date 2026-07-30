import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginatedResult } from '../owners/owners.service';

export interface ProductMargin {
  amount: number;
  percent: number | null;
}

export type ProductWithMargin = Product & { margin: ProductMargin };

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductWithMargin> {
    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }
    if (dto.sku) {
      await this.assertSkuAvailable(dto.sku);
    }
    const product = this.productsRepository.create(dto);
    const saved = await this.productsRepository.save(product);
    return this.toResponse(saved);
  }

  async findAll(
    query: ListProductsQueryDto,
  ): Promise<PaginatedResult<ProductWithMargin>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const active = query.active ?? true;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .where('product.active = :active', { active });

    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('product.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map((product) => this.toResponse(product)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<ProductWithMargin> {
    const product = await this.findEntity(id);
    return this.toResponse(product);
  }

  async findByBarcode(barcode: string): Promise<ProductWithMargin> {
    const product = await this.productsRepository.findOne({
      where: { barcode, active: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.toResponse(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductWithMargin> {
    const product = await this.findEntity(id);
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }
    if (dto.sku && dto.sku !== product.sku) {
      await this.assertSkuAvailable(dto.sku);
    }
    Object.assign(product, dto);
    const saved = await this.productsRepository.save(product);
    return this.toResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findEntity(id);
    product.active = false;
    await this.productsRepository.save(product);
  }

  private async findEntity(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, active: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  private async assertCategoryExists(categoryId: number): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId, active: true },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada o inactiva');
    }
  }

  private async assertSkuAvailable(sku: string): Promise<void> {
    const existing = await this.productsRepository.findOne({
      where: { sku },
    });
    if (existing) {
      throw new ConflictException('Ya existe un producto con ese SKU');
    }
  }

  private toResponse(product: Product): ProductWithMargin {
    const amount = Number(product.salePrice) - Number(product.cost);
    const percent =
      Number(product.cost) > 0 ? (amount / Number(product.cost)) * 100 : null;
    return { ...product, margin: { amount, percent } };
  }
}
