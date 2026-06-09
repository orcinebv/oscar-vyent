import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsOptional()
  @IsUUID(4)
  productId?: string;

  @IsOptional()
  @IsUUID(4)
  comboId?: string;

  @IsOptional()
  @IsString()
  itemType?: 'product' | 'combo';

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedExtras?: string[];
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
