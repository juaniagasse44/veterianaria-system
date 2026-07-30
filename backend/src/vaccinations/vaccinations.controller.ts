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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { ListVaccinationsQueryDto } from './dto/list-vaccinations-query.dto';
import { UpcomingVaccinationsQueryDto } from './dto/upcoming-vaccinations-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('vaccinations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller('vaccinations')
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  @ApiOperation({
    summary: 'Registrar una vacuna aplicada',
    description:
      'Si trae productId y ese producto lleva stock, descuenta 1 unidad en la ' +
      'misma transacción (reference_type=VACCINE).',
  })
  @Post()
  create(@Body() dto: CreateVaccinationDto) {
    return this.vaccinationsService.create(dto);
  }

  @ApiOperation({ summary: 'Listar vacunas (carnet si se filtra por petId)' })
  @Get()
  findAll(@Query() query: ListVaccinationsQueryDto) {
    return this.vaccinationsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Vacunas próximas a vencer (next_dose_date ≤ N días)',
  })
  @Get('upcoming')
  findUpcoming(@Query() query: UpcomingVaccinationsQueryDto) {
    return this.vaccinationsService.findUpcoming(query.days ?? 30);
  }

  @ApiOperation({ summary: 'Ver el detalle de una vacuna aplicada' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vaccinationsService.findOne(id);
  }
}
