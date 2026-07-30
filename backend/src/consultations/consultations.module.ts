import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './entities/consultation.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, Pet, Appointment, Veterinarian]),
    AuthModule,
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
})
export class ConsultationsModule {}
