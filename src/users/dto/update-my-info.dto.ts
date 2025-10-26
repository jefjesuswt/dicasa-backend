import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { IsPhoneNumber } from 'class-validator'; // (Asegúrate de tener class-validator)

export class UpdateMyInfoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}
