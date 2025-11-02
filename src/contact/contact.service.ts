import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  async handleContactRequest(
    createContactDto: CreateContactDto,
  ): Promise<{ message: string }> {
    const { name, email, phoneNumber, message } = createContactDto;

    this.logger.log(`Recibida nueva solicitud de contacto de: ${email}`);

    let adminEmails: string[];
    try {
      const { data: superAdmins } = await this.usersService.findAll({
        role: UserRole.SUPERADMIN,
        page: 1,
        limit: 10,
      });

      if (!superAdmins || superAdmins.length === 0) {
        this.logger.error(
          '¡Error Crítico! No se encontró ningún SUPERADMIN para recibir el correo de contacto.',
        );
        throw new InternalServerErrorException(
          'Error al procesar la solicitud.',
        );
      }

      adminEmails = superAdmins.map((admin) => admin.email);
      this.logger.log(
        `Enviando correo de contacto a: ${adminEmails.join(', ')}`,
      );
    } catch (error) {
      this.logger.error('Error al buscar superadministradores:', error.stack);
      throw new InternalServerErrorException('Error al procesar la solicitud.');
    }

    try {
      await this.mailService.sendEmail(
        adminEmails.join(', '),
        `Nuevo Mensaje de Contacto de: ${name}`,
        'contact-notification',
        {
          clientName: name,
          clientEmail: email,
          clientPhone: phoneNumber,
          message: message,
        },
      );

      this.logger.log(`Correo de contacto enviado a ${adminEmails.join(', ')}`);

      await this.mailService.sendEmail(
        email,
        'Hemos recibido tu mensaje | Dicasa Group',
        'client-contact-confirmation',
        {
          clientName: name,
        },
      );

      return { message: 'Mensaje enviado exitosamente.' };
    } catch (error) {
      this.logger.error(
        `Error al enviar correo de contacto para ${email}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error al enviar el mensaje.');
    }
  }
}
