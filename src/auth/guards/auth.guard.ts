import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    let payload: JwtPayload;
    if (!token) {
      throw new UnauthorizedException('No bearer token provided in request.');
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

      if (!secret) {
        this.logger.error(
          'AuthGuard: JWT_ACCESS_SECRET is not defined in ConfigService.',
        );
        throw new InternalServerErrorException(
          'JWT secret configuration error.',
        );
      }

      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });
    } catch (error) {
      this.logger.error(
        `AuthGuard: Token verification failed - ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.usersService.findOneById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }
    request['user'] = user;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
