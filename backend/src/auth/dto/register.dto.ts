import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'empleado@vetsystem.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'María Gómez', minLength: 2 })
  @IsString()
  @MinLength(2)
  fullName: string;
}
