import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [UsersModule, MailModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
