import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateVaccinationDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  petId: number;

  @ApiProperty({ example: 'Antirrábica' })
  @IsString()
  @MaxLength(150)
  vaccineName: string;

  @ApiPropertyOptional({
    example: 4,
    description:
      'Producto de inventario asociado; si lleva stock, descuenta 1 unidad',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({
    example: '2026-07-29',
    description: 'Por defecto, hoy',
  })
  @IsOptional()
  @IsDateString()
  appliedDate?: string;

  @ApiPropertyOptional({
    example: '2027-07-29',
    description: 'Próxima dosis/vencimiento (alternativa a validDays)',
  })
  @IsOptional()
  @IsDateString()
  nextDoseDate?: string;

  @ApiPropertyOptional({
    example: 365,
    description:
      'Días de validez desde appliedDate (alternativa a nextDoseDate)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  validDays?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  veterinarianId?: number;

  @ApiPropertyOptional({ example: 'Primera dosis' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
