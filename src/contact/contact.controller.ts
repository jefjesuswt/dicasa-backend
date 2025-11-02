import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async handleContactRequest(@Body() createContactDto: CreateContactDto) {
    return this.contactService.handleContactRequest(createContactDto);
  }
}
