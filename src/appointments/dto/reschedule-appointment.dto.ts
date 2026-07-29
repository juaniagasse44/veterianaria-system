import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  veterinarianId?: number;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}
