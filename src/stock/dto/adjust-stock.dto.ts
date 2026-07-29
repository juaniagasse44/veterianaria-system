import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
