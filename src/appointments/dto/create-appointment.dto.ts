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
  @IsInt()
  @Min(1)
  petId: number;

  @IsInt()
  @Min(1)
  veterinarianId: number;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsEnum(AppointmentReason)
  reason: AppointmentReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
