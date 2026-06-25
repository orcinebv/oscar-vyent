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
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsUUID } from 'class-validator';
import { ExtrasService } from './extras.service';
import { ProductExtra } from './product-extra.entity';
import { CreateProductExtraDto } from './dto/create-product-extra.dto';
import { UpdateProductExtraDto } from './dto/update-product-extra.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class ReorderExtrasDto {
  @IsArray()
  @IsUUID(4, { each: true })
  ids!: string[];
}

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
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductExtraDto): Promise<ProductExtra> {
    return this.extrasService.create(dto);
  }

  @Put('sort-order')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(@Body() dto: ReorderExtrasDto): Promise<void> {
    return this.extrasService.reorder(dto.ids);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductExtraDto,
  ): Promise<ProductExtra> {
    return this.extrasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    return this.extrasService.remove(id);
  }
}
