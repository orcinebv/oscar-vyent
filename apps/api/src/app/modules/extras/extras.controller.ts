import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ExtrasService } from './extras.service';
import { ProductExtra } from './product-extra.entity';
import { CreateProductExtraDto } from './dto/create-product-extra.dto';
import { UpdateProductExtraDto } from './dto/update-product-extra.dto';

@Controller('extras')
export class ExtrasController {
  constructor(private readonly extrasService: ExtrasService) {}

  @Get()
  findAll(): Promise<ProductExtra[]> {
    return this.extrasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<ProductExtra> {
    return this.extrasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductExtraDto): Promise<ProductExtra> {
    return this.extrasService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductExtraDto,
  ): Promise<ProductExtra> {
    return this.extrasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    return this.extrasService.remove(id);
  }
}
