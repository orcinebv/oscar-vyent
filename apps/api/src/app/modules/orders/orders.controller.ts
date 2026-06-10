import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Ip,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Create a new order. Stock is decremented atomically. */
  @Post()
  async create(@Body() dto: CreateOrderDto, @Ip() ip: string): Promise<Order> {
    return this.ordersService.create(dto, ip);
  }

  /** Retrieve a single order with items and payment. */
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  /** Reset the order number sequence. Requires valid JWT. */
  @Post('admin/reset-sequence')
  @UseGuards(JwtAuthGuard)
  async resetSequence(
    @Body() body: { startAt?: number },
  ): Promise<{ nextValue: number }> {
    return this.ordersService.resetOrderSequence(body.startAt ?? 1);
  }
}
