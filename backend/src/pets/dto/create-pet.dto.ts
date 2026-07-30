import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 1,
    description: 'Debe ser un dueño existente y activo',
  })
  @IsInt()
  @Min(1)
  ownerId: number;

  @ApiProperty({ example: 'Toby' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: PetSpecies, example: PetSpecies.PERRO })
  @IsEnum(PetSpecies)
  species: PetSpecies;

  @ApiPropertyOptional({ example: 'Labrador' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @ApiPropertyOptional({ enum: PetSex, example: PetSex.MACHO })
  @IsOptional()
  @IsEnum(PetSex)
  sex?: PetSex;

  @ApiPropertyOptional({
    example: '2023-04-15',
    description: 'Para calcular la edad',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 12.5, description: 'Peso actual en kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 'Marrón' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  color?: string;

  @ApiPropertyOptional({ example: 'Alérgico a la penicilina' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
