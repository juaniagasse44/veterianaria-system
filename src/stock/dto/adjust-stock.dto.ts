import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({
    example: 45,
    description:
      'Cantidad absoluta final; el service calcula la diferencia y genera un movimiento ADJUSTMENT',
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Umbral de alerta de bajo stock',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 'Conteo físico' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
