import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCombo } from './product-combo.entity';
import { Product } from '../products/product.entity';
import { CombosService } from './combos.service';
import { CombosController } from './combos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCombo, Product])],
  controllers: [CombosController],
  providers: [CombosService],
  exports: [CombosService],
})
export class CombosModule {}
