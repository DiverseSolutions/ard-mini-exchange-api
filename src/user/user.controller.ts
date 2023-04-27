import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('user')
@ApiBearerAuth()
@ApiTags("Profile")
export class UserController {

    @Get("/profile")
    async profile(@Req() req) {
        return req.user;
    }
}
