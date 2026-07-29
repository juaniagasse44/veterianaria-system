import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Owner } from './entities/owner.entity';
import { OwnersService } from './owners.service';
import { OwnersController } from './owners.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Owner]), AuthModule],
  controllers: [OwnersController],
  providers: [OwnersService],
})
export class OwnersModule {}
