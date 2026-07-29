import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@vetsystem.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin1234' })
  @IsString()
  password: string;
}
