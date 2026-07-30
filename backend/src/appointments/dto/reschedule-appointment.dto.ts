import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiPropertyOptional({
    example: 2,
    description:
      'Cambiar de veterinario (opcional; por defecto mantiene el actual)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  veterinarianId?: number;

  @ApiProperty({ example: '2026-08-02T10:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: '2026-08-02T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
