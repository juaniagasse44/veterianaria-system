import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class ChangeStatusAppointmentDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMADO,
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
