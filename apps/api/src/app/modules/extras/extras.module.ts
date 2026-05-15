import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductExtra } from './product-extra.entity';
import { ExtrasService } from './extras.service';
import { ExtrasController } from './extras.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductExtra])],
  providers: [ExtrasService],
  controllers: [ExtrasController],
  exports: [ExtrasService],
})
export class ExtrasModule {}
