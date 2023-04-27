
import { AuthGuard } from '@nestjs/passport';
import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ConfigService } from '@nestjs/config';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './enums/role.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    constructor(private jwtService: JwtService, private reflector: Reflector, private configService: ConfigService) {super()}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
        if (isPublic) {
          // 💡 See this condition
          return true;
        }
    
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
          throw new UnauthorizedException();
        }
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.getOrThrow("JWT_SECRET"),
          });
          // 💡 We're assigning the payload to the request object here
          // so that we can access it in our route handlers
          request['user'] = payload;
        } catch {
          throw new UnauthorizedException();
        }

        // check role
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
          ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        return requiredRoles.some((role) => user.role === role);
      }
    
      private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers['authorization']?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
      }

}