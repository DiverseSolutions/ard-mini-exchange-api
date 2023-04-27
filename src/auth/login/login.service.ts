import { BadRequestException, Injectable, UnauthorizedException, UsePipes } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

import { LoginDto } from '../dto/login.dto';
import { TrimPipe } from 'src/utils/trim.pipe';
import { GlobalService } from 'src/utils/global/global.service';
import { Status } from '../enums/status.enum';

@Injectable()
export class LoginService {

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {

    }

    @UsePipes(new TrimPipe())
    async login(request: LoginDto){
        this.checkRequest(request)
        const foundUser = await this.prisma.users.findFirst({
            where: {
                phone_number: request.phone,
            },
            select: {
                user_id: true,
                phone_number: true,
                password: true,
                status: true,
            }
        })
        if (!foundUser) {
            throw new UnauthorizedException("user-not-found");
        }
        if (foundUser.status !== Status.Active) {
            throw new UnauthorizedException("user-inactive")
        }
        const pwdHash = foundUser.password
        const pwdMatch = await argon2.verify(pwdHash, request.password)
        if (!pwdMatch) {
            throw new UnauthorizedException("invalid-credentials")
        }
        const accessToken = await this.jwtService.signAsync({
            phone: request.phone,
            id: foundUser.user_id.toString(),
            role: "user"
        }, {
            expiresIn: '12h'
        })
        return {
            accessToken
        }
    }

    private checkRequest(request: LoginDto) {
        if (!request.phone.match(GlobalService.PHONE_REGEX)) {
            throw new BadRequestException("invalid-phone");
        }
    }
}
