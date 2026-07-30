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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ChangeStatusAppointmentDto } from './dto/change-status-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @ApiOperation({
    summary: 'Reservar un turno',
    description:
      'Controla solapamiento por veterinario con lock transaccional (advisory lock). ' +
      'Devuelve 409 si el veterinario ya tiene un turno en ese horario.',
  })
  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @ApiOperation({
    summary: 'Agenda/listado de turnos (filtros por vet/mascota/fecha/estado)',
  })
  @Get()
  findAgenda(@Query() query: ListAppointmentsQueryDto) {
    return this.appointmentsService.findAgenda(query);
  }

  @ApiOperation({ summary: 'Ver el detalle de un turno' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Reprogramar un turno',
    description: 'Revalida el solapamiento para la nueva ventana horaria.',
  })
  @Patch(':id/reschedule')
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(id, dto);
  }

  @ApiOperation({
    summary: 'Cambiar el estado de un turno',
    description:
      'Valida la transición (PENDIENTE→CONFIRMADO→ATENDIDO, o CANCELADO antes de ATENDIDO).',
  })
  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusAppointmentDto,
  ) {
    return this.appointmentsService.changeStatus(id, dto);
  }

  @ApiOperation({ summary: 'Cancelar un turno (libera la franja horaria)' })
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancel(id);
  }
}
