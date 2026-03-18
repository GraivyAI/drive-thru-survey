import { Controller, Get, Param, Query, UseGuards, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentLocation } from '../auth/decorators/current-location.decorator';
import { JwtPayload } from '../auth/auth.service';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders for location today' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (defaults to today)' })
  async list(
    @CurrentLocation() loc: JwtPayload,
    @Query('date') date?: string,
  ) {
    return this.ordersService.listForLocationToday(loc.locationId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  async detail(
    @CurrentLocation() loc: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.ordersService.getById(id, loc.locationId);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
