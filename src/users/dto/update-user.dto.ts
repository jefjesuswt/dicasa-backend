import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ArrayMinSize,
} from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @IsArray()
  @IsEnum(['USER', 'ADMIN', 'SUPERADMIN'], { each: true })
  @ArrayMinSize(1)
  @IsOptional()
  roles?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
