import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVeterinarianDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}
