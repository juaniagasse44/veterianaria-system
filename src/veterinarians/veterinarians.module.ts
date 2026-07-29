import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Veterinarian]), AuthModule],
  controllers: [VeterinariansController],
  providers: [VeterinariansService],
})
export class VeterinariansModule {}
