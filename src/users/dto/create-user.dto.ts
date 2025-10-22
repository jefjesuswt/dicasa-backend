import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsPhoneNumber()
  phoneNumber: string;

  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  roles?: string[];
}
