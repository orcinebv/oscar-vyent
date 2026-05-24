import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  MinLength,
  IsPositive,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductComboDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  slotCount?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  productIds?: string[];
}
