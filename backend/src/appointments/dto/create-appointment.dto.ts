import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { AppointmentReason } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  petId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  veterinarianId: number;

  @ApiProperty({ example: '2026-08-01T10:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Duración en minutos (alternativa a endAt)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: '2026-08-01T10:30:00.000Z',
    description: 'Fin exacto del turno (alternativa a durationMinutes)',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiProperty({ enum: AppointmentReason, example: AppointmentReason.CONSULTA })
  @IsEnum(AppointmentReason)
  reason: AppointmentReason;

  @ApiPropertyOptional({ example: 'Trae vómitos desde ayer' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
