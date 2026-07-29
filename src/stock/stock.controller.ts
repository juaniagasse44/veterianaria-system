import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { InitialStockDto } from './dto/initial-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('stock')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({
    summary: 'Niveles de stock actuales (con datos del producto)',
  })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('levels')
  listLevels() {
    return this.stockService.listLevels();
  }

  @ApiOperation({ summary: 'Productos con stock por debajo del mínimo' })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('low')
  listLowStock() {
    return this.stockService.listLowStock();
  }

  @ApiOperation({
    summary: 'Valorización total del inventario (Σ cantidad × costo)',
  })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('valuation')
  valuation() {
    return this.stockService.valuation();
  }

  @ApiOperation({ summary: 'Historial de movimientos de stock (ledger)' })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('movements')
  listMovements(@Query() query: ListStockMovementsQueryDto) {
    return this.stockService.listMovements(query.productId);
  }

  @ApiOperation({ summary: 'Cargar el stock inicial de un producto' })
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

  @ApiOperation({
    summary: 'Ajuste manual de stock (genera un movimiento ADJUSTMENT)',
  })
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
