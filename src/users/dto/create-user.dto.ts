import {
  ArrayMinSize,
  IsArray,
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

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['USER', 'ADMIN'], { each: true })
  @IsOptional()
  roles?: string[];
}
