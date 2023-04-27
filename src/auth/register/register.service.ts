import { BadRequestException, Injectable, UnauthorizedException, UsePipes } from '@nestjs/common';
import * as moment from 'moment'
import * as argon2 from 'argon2'
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { Prisma } from '@prisma/client';
import { GlobalService } from 'src/utils/global/global.service';
import { TrimPipe } from 'src/utils/trim.pipe';
import { Status } from '../enums/status.enum';
import { BalanceService } from 'src/balance/balance.service';
import { BalanceLogType } from '../enums/balance-log-type.enum';

@Injectable()
export class RegisterService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly balanceService: BalanceService
    ) {

    }

    @UsePipes(new TrimPipe())
    async register(request: RegisterDto) {
        this.checkRequest(request);
        await this.prisma.$transaction(async (tx) => {
            const exists = await tx.users.findFirst({
                where: {
                    phone_number: request.phone,
                },
                select: {
                    user_id: true,
                    status: true,
                }
            });
            if (exists?.status && exists?.status !== Status.Active) {
                throw new UnauthorizedException('user-inactive')
            }
            if (exists) {
                throw new UnauthorizedException('user-exists')
            }
            const bonus = await tx.register_bonus.findFirst({
                where: {
                    status: Status.Active,
                },
                select: {
                    asset_id: true,
                    amount: true,
                }
            })
            const pwdHash = await argon2.hash(request.password);
            const user = await tx.users.create({
                data: {
                    phone_number: request.phone,
                    status: Status.Active,
                    password: pwdHash,
                    created_at: moment().toDate(),
                }
            })
            if (bonus) {
                await this.balanceService.getOrCreateBalance({
                    prisma: tx,
                    userId: user.user_id,
                    assetId: bonus.asset_id,
                })
                await this.balanceService.debitAndSaveLog({
                    prisma: tx,
                    userId: user.user_id,
                    assetId: bonus.asset_id,
                    debitAvl: bonus.amount,
                    debitHold: bonus.amount,
                    type: BalanceLogType.Deposit
                })
            }
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        })
    }

    private checkRequest(request: RegisterDto) {
        if (!request.phone.match(GlobalService.PHONE_REGEX)) {
            throw new BadRequestException("invalid-phone");
        }
        if (request.password !== request.password2) {
            throw new BadRequestException("password-mismatch");
        }
    }

}
