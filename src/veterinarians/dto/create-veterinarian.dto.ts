import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVeterinarianDto {
  @ApiProperty({ example: 'Dra. Ana Gómez', minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({
    example: 'MP-12345',
    description: 'Matrícula profesional, única si se especifica',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'Clínica general' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @ApiPropertyOptional({ example: '11-2345-6789' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'ana.gomez@vetsystem.local' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}
