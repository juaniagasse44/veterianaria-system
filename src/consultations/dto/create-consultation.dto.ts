import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  petId: number;

  @ApiPropertyOptional({
    example: 5,
    description:
      'Turno que originó la consulta; si se envía, lo marca ATENDIDO',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  appointmentId?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Si no se envía y hay appointmentId, se toma del turno',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  veterinarianId?: number;

  @ApiPropertyOptional({ example: 'Control anual' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ example: 'Sano, sin hallazgos' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Ninguno' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  treatment?: string;

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Si se envía, también actualiza pets.weight',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 'Buen estado general' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
