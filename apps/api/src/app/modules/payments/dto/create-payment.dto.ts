import { IsUUID, IsOptional, IsString, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID(4)
  orderId!: string;

  // Only 'ideal' is supported in v1. Adding 'bancontact', 'creditcard' etc.
  // later requires no backend changes beyond updating this list.
  @IsOptional()
  @IsString()
  @IsIn(['ideal'], { message: 'method must be "ideal"' })
  method?: string;
}
