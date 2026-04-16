import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Ip,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

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
}
