import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Request,
  Query,
  Res,
  Response,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthGuard } from './guards/auth.guard';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UseInterceptors(ClassSerializerInterceptor)
  login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    return this.authService.login(loginUserDto);
  }

  @Post('/register')
  @UseInterceptors(ClassSerializerInterceptor)
  register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    return this.authService.register(registerUserDto);
  }

  @Get('/checkToken')
  @UseGuards(AuthGuard)
  checkToken(@Request() req: Request): Promise<AuthResponseDto> {
    const user = req['user'];
    return this.authService.checkToken(user);
  }

  @Post('/refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(@Request() req: Request) {
    const user = req['user'];
    return await this.authService.refreshTokens(user._id, user.roles);
  }

  @Get('/confirm-email')
  @UseInterceptors(ClassSerializerInterceptor)
  async confirmEmail(@Query('token') token: string): Promise<AuthResponseDto> {
    return await this.authService.confirmEmail(token);
  }

  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  async resendConfirmation(
    @Body() resendConfirmationDto: ResendConfirmationDto,
  ) {
    await this.authService.resendConfirmationEmail(resendConfirmationDto.email);
    return {
      message:
        'If an account with that email exists and is not verified, a new confirmation email has been sent.',
    };
  }

  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.sendPasswordResetEmail(forgotPasswordDto);
    return {
      message:
        'If an account with that email exists, a reset code has been sent.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
