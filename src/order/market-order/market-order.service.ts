import { Injectable } from '@nestjs/common';
import { BadRequestException, Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import * as moment from 'moment';
import { MarketOrderDto } from 'src/auth/dto/order-place.dto';
import { AssetType } from 'src/auth/enums/asset-type.enum';
import { BalanceLogType } from 'src/auth/enums/balance-log-type.enum';
import { OrderSide } from 'src/auth/enums/order-side.enum';
import { OrderStatus } from 'src/auth/enums/order-status.enum';
import { OrderType } from 'src/auth/enums/order-type.enum';
import { Status } from 'src/auth/enums/status.enum';
import { BalanceService } from 'src/balance/balance.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MarketOrderService {

    constructor(private readonly prisma: PrismaService, private readonly balanceService: BalanceService) {

    }

    async executeOrder(request: MarketOrderDto, req: any) {
        this.checkOrder(request);
        if ((request.side !== OrderSide.Buy) && (request.side !== OrderSide.Sell)) {
            throw new BadRequestException('invalid-order-side')
        }
        const userId = BigInt(req.user.id);
        const user = await this.prisma.users.findFirst({
            where: {
                user_id: userId
            },
            select: {
                phone_number: true,
            }
        })
        if (!user) {
            throw new UnauthorizedException("user-not-found")
        }
        const asset = await this.prisma.assets.findFirstOrThrow({
            where: {
                symbol: request.symbol,
                type: AssetType.Stock
            }
        }).catch((e) => {
            throw new BadRequestException("asset-not-found")
        })

        const mntAsset = await this.prisma.assets.findFirstOrThrow({
            where: {
                symbol: 'MNT',
            },
            select: {
                asset_id: true,
            }
        }).catch((e) => {
            throw new BadRequestException("asset-not-found")
        })

        const assetPrice = await this.prisma.asset_prices.findFirst({
            select: {
                price: true,
                asset_price_id: true,
            },
            where: {
                OR: [
                    {
                        base_asset_id: asset.asset_id,
                        quote_asset_id: mntAsset.asset_id,
                        since: {
                            lte: moment().toDate(),
                        },
                        until: {
                            gt: moment().toDate()
                        }
                    },
                    {
                        base_asset_id: asset.asset_id,
                        quote_asset_id: mntAsset.asset_id,
                        since: {
                            gte: moment().toDate(),
                        },
                        until: null,
                    },
                ]
            }
        })
        if (!assetPrice?.price) {
            throw new BadRequestException('price-not-found')
        }
        const total = BigNumber(request.amount).times(BigNumber(assetPrice.price.toFixed()))
        if (total.times(BigNumber(10).pow(9)).decimalPlaces() > 0) {
            throw new BadRequestException('total-invalid')
        }
        const totalDecimal = new Prisma.Decimal(total.toFixed())
        const qtyDecimal = new Prisma.Decimal(request.amount)
        let result: any = null;
        if (request.side === OrderSide.Buy) {
            await this.prisma.$transaction(async (tx) => {
                const order = await tx.orders.create({
                    data: {
                        status: OrderStatus.Fulfilled,
                        base_asset_id: asset.asset_id,
                        quote_asset_id: mntAsset.asset_id,
                        type: OrderType.Market,
                        side: request.side,
                        user_id: userId,
                        price_id: assetPrice.asset_price_id,
                        price: assetPrice.price,
                        qty: qtyDecimal,
                        total: totalDecimal,
                        created_at: moment().toDate(),
                    },
                    select: {
                        order_id: true,
                    }
                })
                result = order;
                await this.balanceService.creditAndSaveLog({
                    prisma: tx,
                    userId,
                    assetId: mntAsset.asset_id,
                    creditAvl: totalDecimal,
                    creditHold: totalDecimal,
                    type: BalanceLogType.Match,
                    orderId: order.order_id,
                })
                await this.balanceService.debitAndSaveLog({
                    prisma: tx,
                    userId,
                    assetId: asset.asset_id,
                    debitAvl: qtyDecimal,
                    debitHold: qtyDecimal,
                    type: BalanceLogType.Match,
                    orderId: order.order_id,
                })
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable
            })
        } else if (request.side === OrderSide.Sell) {
            await this.prisma.$transaction(async (tx) => {
                const order = await tx.orders.create({
                    data: {
                        status: OrderStatus.Fulfilled,
                        base_asset_id: asset.asset_id,
                        quote_asset_id: mntAsset.asset_id,
                        type: OrderType.Market,
                        side: request.side,
                        user_id: userId,
                        price_id: assetPrice.asset_price_id,
                        price: assetPrice.price,
                        qty: qtyDecimal,
                        total: totalDecimal,
                        created_at: moment().toDate(),
                    },
                    select: {
                        order_id: true,
                    }
                })
                result = order;
                await this.balanceService.creditAndSaveLog({
                    prisma: tx,
                    userId,
                    assetId: asset.asset_id,
                    creditAvl: qtyDecimal,
                    creditHold: qtyDecimal,
                    type: BalanceLogType.Match,
                    orderId: order.order_id,
                })
                await this.balanceService.debitAndSaveLog({
                    prisma: tx,
                    userId,
                    assetId: mntAsset.asset_id,
                    debitAvl: totalDecimal,
                    debitHold: totalDecimal,
                    type: BalanceLogType.Match,
                    orderId: order.order_id,
                })
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable
            })
        }
    }

    private checkOrder(order: MarketOrderDto) {
        if (order.amount <= 0) {
            throw new BadRequestException("amount-is-empty")
        }
    }
}
