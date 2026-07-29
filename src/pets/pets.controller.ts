import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { ListPetsQueryDto } from './dto/list-pets-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('pets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @ApiOperation({ summary: 'Registrar una mascota asociada a un dueño' })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post()
  create(@Body() dto: CreatePetDto) {
    return this.petsService.create(dto);
  }

  @ApiOperation({ summary: 'Listar mascotas (filtros + paginación)' })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get()
  findAll(@Query() query: ListPetsQueryDto) {
    return this.petsService.findAll(query);
  }

  @ApiOperation({ summary: 'Ver la ficha de una mascota (con edad calculada)' })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.petsService.findOne(id);
  }

  @ApiOperation({ summary: 'Editar una mascota (no permite cambiar de dueño)' })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePetDto) {
    return this.petsService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Dar de baja una mascota (soft delete, solo ADMIN)',
  })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.petsService.remove(id);
  }
}
