import { Body, Controller, Post, Req } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterService } from './register/register.service';
import { LoginService } from './login/login.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';
import { Role } from './enums/role.enum';

@Controller('auth')
@ApiTags("Auth")
export class AuthController {

    constructor(
        private readonly registerService: RegisterService,
        private readonly loginService: LoginService,
    ) {}

    @Public()
    @Post('/login')
    async login(@Body() request: LoginDto) {
        return await this.loginService.login(request);
    }

    @Public()
    @Post('/register')
    async register(@Body() request: RegisterDto) {
        return await this.registerService.register(request);
    }

    /** 
     * Authorization example 
     * */
    // @Post("/admin-is-my-role")
    // @Roles(Role.Admin)
    // @ApiBearerAuth()
    // async admin() {
    //     return {
    //         message: "OK"
    //     }
    // }
}
