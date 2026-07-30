import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ProductUnit } from '../entities/product.entity';

export class CreateProductDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    example: 'AL-001',
    description: 'Único si se especifica',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  @ApiPropertyOptional({ example: '7791234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @ApiProperty({ example: 'Alimento Perro 15kg' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Alimento balanceado para perros adultos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 25000, description: 'Precio de venta' })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiPropertyOptional({
    example: 15000,
    default: 0,
    description: 'Costo, para el margen',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 21, description: 'Alícuota de IVA (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @ApiPropertyOptional({ enum: ProductUnit, default: ProductUnit.UNIDAD })
  @IsOptional()
  @IsEnum(ProductUnit)
  unit?: ProductUnit;

  @ApiPropertyOptional({
    default: true,
    description: 'Si es false, no descuenta inventario (ej. un servicio)',
  })
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;
}
