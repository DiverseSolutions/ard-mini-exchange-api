import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as moment from 'moment'
import BigNumber from 'bignumber.js';
import { Status } from 'src/auth/enums/status.enum';
import { BalanceLogService } from './balance-log/balance-log.service';
import { BalanceLogType } from 'src/auth/enums/balance-log-type.enum';

type GetOrCreateBalanceParams = {
    prisma: Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">,
    userId: bigint,
    assetId: bigint,
}

type CreditAndSaveLogParams = {
    prisma: Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">,
    userId: bigint,
    assetId: bigint,
    creditAvl: Prisma.Decimal,
    creditHold: Prisma.Decimal,
    type: BalanceLogType,
    orderId?: bigint,
}

type DebitAndSaveLogParams = {
    prisma: Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">,
    userId: bigint,
    assetId: bigint,
    debitAvl: Prisma.Decimal,
    debitHold: Prisma.Decimal,
    type: BalanceLogType,
    orderId?: bigint,
}

@Injectable()
export class BalanceService {

    constructor(private readonly prisma: PrismaService, private readonly balanceLogService: BalanceLogService) {

    }

    async getOrCreateBalance(params: GetOrCreateBalanceParams) {
        const balance = await params.prisma.user_balances.findFirst({
            where: {
                user_id: params.userId,
                asset_id: params.assetId
            },
            select: {
                user_balance_id: true,
                sequence: true,
                status: true,
                user_id: true,
                asset_id: true,
                balance_avl: true,
                balance_hold: true,
                created_at: true,
            }
        })
        if (!balance) {
            const initialBalanceSequence = BigInt(0);
            await this.balanceLogService.saveLog({
                prisma: params.prisma,
                balanceAvl: balance.balance_avl,
                balanceHold: balance.balance_hold,
                userId: params.userId,
                assetId: params.assetId,
                creditAvl: new Prisma.Decimal(0),
                creditHold: new Prisma.Decimal(0),
                debitAvl: new Prisma.Decimal(0),
                debitHold: new Prisma.Decimal(0),
                sequence: initialBalanceSequence,
                type: BalanceLogType.Create,
            })
            const newBalance = await params.prisma.user_balances.create({
                data: {
                    user_id: params.userId,
                    asset_id: params.assetId,
                    balance_avl: new Prisma.Decimal(0),
                    balance_hold: new Prisma.Decimal(0),
                    created_at: moment().toDate(),
                    sequence: initialBalanceSequence,
                    status: Status.Active,
                },
                select: {
                    user_balance_id: true,
                    sequence: true,
                    status: true,
                    user_id: true,
                    asset_id: true,
                    balance_avl: true,
                    balance_hold: true,
                    created_at: true,
                }
            })
            return newBalance;
        }
        return balance;
    }

    async creditAndSaveLog(params: CreditAndSaveLogParams) {
        const balance = await this.getOrCreateBalance({
            prisma: params.prisma,
            assetId: params.assetId,
            userId: params.userId,
        })
        const newAvl = BigNumber(balance.balance_avl.toFixed()).minus(BigNumber(params.creditAvl.toFixed()))
        if (newAvl.comparedTo(0) < 0) {
            throw new BadRequestException('balance-insufficient')
        }
        const newHold = BigNumber(balance.balance_hold.toFixed()).minus(BigNumber(params.creditHold.toFixed()))
        if (newHold.comparedTo(0) < 0) {
            throw new BadRequestException('balance-insufficient')
        }
        await this.balanceLogService.saveLog({
            prisma: params.prisma,
            balanceAvl: balance.balance_avl,
            balanceHold: balance.balance_hold,
            userId: params.userId,
            assetId: params.assetId,
            creditAvl: params.creditAvl,
            creditHold: params.creditHold,
            debitAvl: new Prisma.Decimal(0),
            debitHold: new Prisma.Decimal(0),
            sequence: balance.sequence,
            type: params.type,
            orderId: params.orderId,
        })
        const nextSequence = BigNumber(balance.sequence.toString()).plus(BigNumber(1)).toFixed()
        await params.prisma.user_balances.update({
            where: {
                user_balance_id: balance.user_balance_id,
            },
            data: {
                balance_avl: new Prisma.Decimal(newAvl.toFixed()),
                balance_hold: new Prisma.Decimal(newHold.toFixed()),
                sequence: BigInt(nextSequence),
                updated_at: moment().toDate(),
            }
        })
    }

    async debitAndSaveLog(params: DebitAndSaveLogParams) {
        const balance = await this.getOrCreateBalance({
            prisma: params.prisma,
            assetId: params.assetId,
            userId: params.userId,
        })
        const newAvl = BigNumber(balance.balance_avl.toFixed()).plus(BigNumber(params.debitAvl.toFixed()))
        const newHold = BigNumber(balance.balance_hold.toFixed()).plus(BigNumber(params.debitHold.toFixed()))
        await this.balanceLogService.saveLog({
            prisma: params.prisma,
            balanceAvl: balance.balance_avl,
            balanceHold: balance.balance_hold,
            userId: params.userId,
            assetId: params.assetId,
            creditAvl: new Prisma.Decimal(0),
            creditHold: new Prisma.Decimal(0),
            debitAvl: params.debitAvl,
            debitHold: params.debitHold,
            sequence: balance.sequence,
            type: params.type,
            orderId: params.orderId,
        })
        const nextSequence = BigNumber(balance.sequence.toString()).plus(BigNumber(1)).toFixed()
        await params.prisma.user_balances.update({
            where: {
                user_balance_id: balance.user_balance_id,
            },
            data: {
                balance_avl: new Prisma.Decimal(newAvl.toFixed()),
                balance_hold: new Prisma.Decimal(newHold.toFixed()),
                sequence: BigInt(nextSequence),
                updated_at: moment().toDate(),
            }
        })
    }
}
