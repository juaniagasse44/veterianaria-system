import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { InitialStockDto } from './dto/initial-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('levels')
  listLevels() {
    return this.stockService.listLevels();
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('low')
  listLowStock() {
    return this.stockService.listLowStock();
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('valuation')
  valuation() {
    return this.stockService.valuation();
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('movements')
  listMovements(@Query() query: ListStockMovementsQueryDto) {
    return this.stockService.listMovements(query.productId);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('initial')
  setInitialStock(@Body() dto: InitialStockDto) {
    return this.stockService.setInitialStock(
      dto.productId,
      dto.quantity,
      dto.notes,
      dto.minQuantity,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto) {
    return this.stockService.adjust(
      dto.productId,
      dto.quantity,
      dto.notes,
      dto.minQuantity,
    );
  }
}
