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
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';

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
        'Se ha enviado un correo de confirmación a la dirección proporcionada.',
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    const { email, password } = loginUserDto;

    const user = await this.userService.findOneByEmail(email, true);

    if (!user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Por favor, confirma tu correo antes de iniciar sesión.',
      );
    }

    const isPasswordCorrect = await argon2.verify(user.password, password);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
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

  private async getToken(
    payload: JwtPayload,
    roles: string[],
  ): Promise<JwtResponse> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_ACCESS_EXPIRATION', '900'), // Get as string, default '900'
        10, // Parse as base-10 integer
      ),
    });
    const response: JwtResponse = {
      accessToken: accessToken,
    };
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
      'FRONTEND_URL',
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
      throw new UnauthorizedException(
        'Token de confirmación no válido o caducado.',
      );
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
      throw new BadRequestException('La cuenta ya ha sido verificada.');
    }

    try {
      await this.sendConfirmationEmail(user);
    } catch (error) {
      console.error('Error al reenviar correo de confirmación:', error);
      throw new InternalServerErrorException(
        'No se pudo reenviar el correo de confirmación.',
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const hashedCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.userService.setPasswordResetToken(user._id, hashedCode, expires);
    const resetLink = `${frontendUrl}/auth/set-password?email=${encodeURIComponent(user.email)}&code=${resetCode}`;
    await this.mailService.sendEmail(
      user.email,
      'Restablece tu contraseña - Dicasa Group',
      'password-reset',
      {
        name: user.name,
        resetCode, //  codigo simple (ej: "123456")
        resetLink,
      },
    );
  }

  async verifyResetCode(verifyCodeDto: VerifyCodeDto): Promise<boolean> {
    const { email, code } = verifyCodeDto;
    const user = await this.userService.findOneByEmail(email, true); // Necesitamos los campos privados

    if (
      !user ||
      !user.passwordResetToken ||
      !user.passwordResetExpires ||
      new Date() > user.passwordResetExpires
    ) {
      throw new UnauthorizedException('El código ha caducado o es inválido.');
    }

    const hashedInputCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    if (hashedInputCode !== user.passwordResetToken) {
      throw new UnauthorizedException('Código inválido.');
    }

    return true;
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
      throw new UnauthorizedException('El código ha caducado o es inválido.');
    }

    const hashedInputCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    if (hashedInputCode !== user.passwordResetToken) {
      throw new UnauthorizedException('Código inválido.');
    }

    const newPasswordHash = await argon2.hash(newPassword);
    await this.userService.updatePassword(user._id, newPasswordHash);
    return { message: 'La contraseña se ha restablecido correctamente.' };
  }
}
