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
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { ListVeterinariansQueryDto } from './dto/list-veterinarians-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('veterinarians')
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateVeterinarianDto) {
    return this.veterinariansService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get()
  findAll(@Query() query: ListVeterinariansQueryDto) {
    return this.veterinariansService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.veterinariansService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVeterinarianDto,
  ) {
    return this.veterinariansService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.veterinariansService.remove(id);
  }
}
