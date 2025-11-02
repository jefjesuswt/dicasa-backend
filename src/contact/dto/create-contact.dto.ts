import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido.' })
  name: string;

  @IsEmail({}, { message: 'Por favor, ingresa un email válido.' })
  @IsNotEmpty({ message: 'El email es requerido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido.' })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje es requerido.' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres.' })
  message: string;
}
