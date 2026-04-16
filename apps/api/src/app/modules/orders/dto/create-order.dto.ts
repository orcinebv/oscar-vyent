import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  Matches,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID(4)
  productId!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

export class CreateOrderDto {
  @IsEmail()
  @MaxLength(255)
  customerEmail!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customerFirstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customerLastName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9\s\-().]{7,20}$/, {
    message: 'customerPhone must be a valid phone number',
  })
  customerPhone?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  shippingAddress!: string;

  // Dutch postal code: 4 digits + optional space + 2 uppercase letters
  @IsString()
  @Matches(/^[1-9][0-9]{3}\s?[A-Z]{2}$/, {
    message: 'shippingPostalCode must be a valid Dutch postal code (e.g. 1234 AB)',
  })
  shippingPostalCode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  shippingCity!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  shippingCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
