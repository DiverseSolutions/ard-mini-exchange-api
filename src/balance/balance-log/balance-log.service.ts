import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as moment from 'moment';
import { Status } from 'src/auth/enums/status.enum';
import { BalanceLogType } from 'src/auth/enums/balance-log-type.enum';


type SaveLogParams = {
    prisma: Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">,
    userId: bigint,
    sequence: bigint,
    assetId: bigint,
    balanceAvl: Prisma.Decimal,
    balanceHold: Prisma.Decimal,
    debitAvl: Prisma.Decimal,
    creditAvl: Prisma.Decimal,
    debitHold: Prisma.Decimal,
    creditHold: Prisma.Decimal,
    type: BalanceLogType,
    orderId?: bigint,
}

@Injectable()
export class BalanceLogService {

    async saveLog(params: SaveLogParams) {
        await params.prisma.user_balance_log.create({
            data: {
                user_id: params.userId,
                sequence: params.sequence,
                asset_id: params.assetId,
                credit_avl: params.creditAvl,
                credit_hold: params.creditHold,
                debit_avl: params.debitAvl,
                debit_hold: params.debitHold,
                balance_avl: params.balanceAvl,
                balance_hold: params.balanceHold,
                order_id: params.orderId,
                created_at: moment().toDate(),
                status: Status.Active,
                type: params.type
            }
        })
    }
}
