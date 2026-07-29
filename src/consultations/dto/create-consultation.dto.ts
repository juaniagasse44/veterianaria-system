import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateConsultationDto {
  @IsInt()
  @Min(1)
  petId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  appointmentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  veterinarianId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  treatment?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
