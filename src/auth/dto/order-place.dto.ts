import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Min, IsIn } from 'class-validator';
import { OrderSide } from "../enums/order-side.enum";

export class MarketOrderDto {

    @ApiProperty()
    @IsNotEmpty()
    symbol: string;

    @ApiProperty()
    @IsNotEmpty()
    @Min(1)
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsIn([OrderSide.Buy, OrderSide.Sell])
    side: string;
}