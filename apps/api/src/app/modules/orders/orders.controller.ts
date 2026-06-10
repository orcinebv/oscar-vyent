import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Ip,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';
import { AppConfig } from '../../config/configuration';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

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

  /** Reset the order number sequence. Requires x-admin-key header. */
  @Post('admin/reset-sequence')
  async resetSequence(
    @Headers('x-admin-key') key: string,
    @Body() body: { startAt?: number },
  ): Promise<{ nextValue: number }> {
    const adminKey = this.config.get('admin', { infer: true })?.apiKey;
    if (!adminKey || key !== adminKey) {
      throw new ForbiddenException('Ongeldig admin sleutel');
    }
    return this.ordersService.resetOrderSequence(body.startAt ?? 1);
  }
}
