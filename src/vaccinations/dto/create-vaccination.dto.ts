import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateVaccinationDto {
  @IsInt()
  @Min(1)
  petId: number;

  @IsString()
  @MaxLength(150)
  vaccineName: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @IsDateString()
  appliedDate?: string;

  @IsOptional()
  @IsDateString()
  nextDoseDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  validDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  veterinarianId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
