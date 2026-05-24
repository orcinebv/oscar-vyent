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

export class UpdateProductComboDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

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
