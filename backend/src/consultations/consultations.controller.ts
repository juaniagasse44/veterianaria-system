import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ListConsultationsQueryDto } from './dto/list-consultations-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('consultations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @ApiOperation({
    summary: 'Registrar una consulta',
    description:
      'Si viene appointmentId, marca ese turno como ATENDIDO. Si trae weight, ' +
      'actualiza el peso actual de la mascota. Todo en una sola transacción.',
  })
  @Post()
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @ApiOperation({
    summary: 'Listar consultas (historia clínica si se filtra por petId)',
  })
  @Get()
  findAll(@Query() query: ListConsultationsQueryDto) {
    return this.consultationsService.findAll(query);
  }

  @ApiOperation({ summary: 'Ver el detalle de una consulta' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultationsService.findOne(id);
  }

  @ApiOperation({
    summary:
      'Editar una consulta (edición acotada: no cambia pet/turno/veterinario)',
  })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.consultationsService.update(id, dto);
  }
}
