import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { plainToInstance } from 'class-transformer';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtResponse } from './interfaces/jwt-response.interface';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.create({
      ...registerUserDto,
      roles: ['USER'],
    });

    await this.sendConfirmationEmail(user);

    return {
      message:
        'Registration successful. Please check your email to confirm your account.',
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    const { email, password } = loginUserDto;

    const user = await this.userService.findOneByEmail(email, true);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please confirm your email before logging in.',
      );
    }

    const isPasswordCorrect = await argon2.verify(user.password, password);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const userData = plainToInstance(User, user.toObject());

    let token = await this.getToken({ userId: userData._id }, userData.roles);

    return {
      user: userData,
      token,
    };
  }

  async checkToken(user: User): Promise<AuthResponseDto> {
    const token = await this.getToken({ userId: user._id }, user.roles);
    return {
      user,
      token,
    };
  }

  async refreshTokens(userId: string, roles: string[]): Promise<JwtResponse> {
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User not active.');
    }

    const tokens = await this.getToken({ userId }, roles);

    return tokens;
  }

  private async getToken(
    payload: JwtPayload,
    roles: string[],
  ): Promise<JwtResponse> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRATION', 900),
    });
    const response: JwtResponse = {
      accessToken,
    };
    if (!roles.includes('ADMIN') && !roles.includes('SUPERADMIN')) {
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<number>('JWT_EXPIRATION', 604800),
      });
      response.refreshToken = refreshToken;
    }
    return response;
  }

  private async sendConfirmationEmail(user: User) {
    const payload: JwtPayload = { userId: user._id };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_CONFIRM_SECRET'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_EXPIRATION', '604800'),
        10,
      ),
    });

    const confirmationLink = `${this.configService.get(
      'API_URL',
    )}/auth/confirm-email?token=${token}`;

    await this.mailService.sendEmail(
      user.email,
      'Confirma tu correo electrónico - Dicasa Group',
      'email-confirmation',
      {
        name: user.name,
        link: confirmationLink,
      },
    );
  }

  async confirmEmail(token: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_CONFIRM_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired confirmation token');
    }

    const user = await this.userService.markEmailAsVerified(payload.userId);

    const userInstance = plainToInstance(User, user.toObject());
    const tokens = await this.getToken(
      { userId: userInstance._id },
      userInstance.roles,
    );

    return {
      user: userInstance,
      token: tokens,
    };
  }

  async resendConfirmationEmail(email: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      return;
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('User is already verified.');
    }

    try {
      await this.sendConfirmationEmail(user);
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      throw new InternalServerErrorException(
        'Could not resend confirmation email.',
      );
    }
  }

  async sendPasswordResetEmail(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.userService.findOneByEmail(email, true);
    if (!user) {
      return;
    }
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.userService.setPasswordResetToken(user._id, hashedCode, expires);

    await this.mailService.sendEmail(
      user.email,
      'Restablece tu contraseña - Dicasa Group',
      'password-reset',
      {
        name: user.name,
        resetCode: resetCode, //  codigo simple (ej: "123456")
        resetLink: '#', //  placeholder para la variable {{resetLink}}
      },
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetPasswordDto;
    const user = await this.userService.findOneByEmail(email);

    if (
      !user ||
      !user.passwordResetToken ||
      !user.passwordResetExpires ||
      new Date() > user.passwordResetExpires
    ) {
      throw new UnauthorizedException('Code has expired or is invalid');
    }

    const hashedInputCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    if (hashedInputCode !== user.passwordResetToken) {
      throw new UnauthorizedException('Invalid code');
    }

    const newPasswordHash = await argon2.hash(newPassword);
    await this.userService.updatePassword(user._id, newPasswordHash);
    return { message: 'Password has been reset successfully.' };
  }
}
