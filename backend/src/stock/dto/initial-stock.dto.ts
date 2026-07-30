import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class InitialStockDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({
    example: 50,
    description: 'Cantidad inicial (genera un movimiento INITIAL)',
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Umbral de alerta de bajo stock',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 'Carga inicial de stock' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
