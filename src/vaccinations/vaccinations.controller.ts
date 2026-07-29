import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { ListVaccinationsQueryDto } from './dto/list-vaccinations-query.dto';
import { UpcomingVaccinationsQueryDto } from './dto/upcoming-vaccinations-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller('vaccinations')
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  @Post()
  create(@Body() dto: CreateVaccinationDto) {
    return this.vaccinationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListVaccinationsQueryDto) {
    return this.vaccinationsService.findAll(query);
  }

  @Get('upcoming')
  findUpcoming(@Query() query: UpcomingVaccinationsQueryDto) {
    return this.vaccinationsService.findUpcoming(query.days ?? 30);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vaccinationsService.findOne(id);
  }
}
