import { IsNumber, Min } from 'class-validator';

export class CreateBidDto {
  @IsNumber()
  listingId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
