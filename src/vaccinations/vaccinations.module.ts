import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vaccination } from './entities/vaccination.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Product } from '../products/entities/product.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { VaccinationsService } from './vaccinations.service';
import { VaccinationsController } from './vaccinations.controller';
import { AuthModule } from '../auth/auth.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vaccination, Pet, Product, Veterinarian]),
    AuthModule,
    StockModule,
  ],
  controllers: [VaccinationsController],
  providers: [VaccinationsService],
})
export class VaccinationsModule {}
