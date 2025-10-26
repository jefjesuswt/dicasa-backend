import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @MinLength(6)
  @IsString()
  password: string;

  @MinLength(6)
  @IsString()
  newPassword: string;
}
