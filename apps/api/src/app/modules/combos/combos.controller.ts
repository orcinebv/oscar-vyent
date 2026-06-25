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
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsUUID } from 'class-validator';
import { CombosService } from './combos.service';
import { ProductCombo } from './product-combo.entity';
import { CreateProductComboDto } from './dto/create-product-combo.dto';
import { UpdateProductComboDto } from './dto/update-product-combo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class ReorderCombosDto {
  @IsArray()
  @IsUUID(4, { each: true })
  ids!: string[];
}

@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Get()
  findAll(
    @Query('all', new ParseBoolPipe({ optional: true })) all?: boolean,
  ): Promise<ProductCombo[]> {
    return this.combosService.findAll(all);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ProductCombo> {
    return this.combosService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductComboDto): Promise<ProductCombo> {
    return this.combosService.create(dto);
  }

  @Put('sort-order')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(@Body() dto: ReorderCombosDto): Promise<void> {
    return this.combosService.reorder(dto.ids);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductComboDto,
  ): Promise<ProductCombo> {
    return this.combosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.combosService.remove(id);
  }
}
