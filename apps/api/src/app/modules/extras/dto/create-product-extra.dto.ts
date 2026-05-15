import { IsString, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateProductExtraDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultForCategories?: string[];
}
