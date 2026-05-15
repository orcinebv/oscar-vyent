import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { IsArray, IsUUID } from 'class-validator';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

class SetExtrasDto {
  @IsArray()
  @IsUUID(4, { each: true })
  extraIds!: string[];
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('all', new ParseBoolPipe({ optional: true })) all?: boolean,
  ): Promise<Product[]> {
    return this.productsService.findAll(all);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Put(':id/extras')
  async setExtras(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: SetExtrasDto,
  ): Promise<Product> {
    return this.productsService.setExtras(id, dto.extraIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
