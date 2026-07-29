import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PetSex, PetSpecies } from '../entities/pet.entity';

export class CreatePetDto {
  @IsInt()
  @Min(1)
  ownerId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(PetSpecies)
  species: PetSpecies;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @IsOptional()
  @IsEnum(PetSex)
  sex?: PetSex;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
