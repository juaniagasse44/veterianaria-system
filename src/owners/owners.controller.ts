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
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { ListOwnersQueryDto } from './dto/list-owners-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post()
  create(@Body() dto: CreateOwnerDto) {
    return this.ownersService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get()
  findAll(@Query() query: ListOwnersQueryDto) {
    return this.ownersService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ownersService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOwnerDto) {
    return this.ownersService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ownersService.remove(id);
  }
}
