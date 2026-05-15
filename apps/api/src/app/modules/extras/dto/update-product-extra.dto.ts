import { IsString, IsOptional, IsArray, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateProductExtraDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultForCategories?: string[];
}
