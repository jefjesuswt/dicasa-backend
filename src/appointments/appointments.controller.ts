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
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReassignAgentDto } from './dto/reassign-agent.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { User } from '../users/entities/user.entity';
import { QueryAppointmentDto } from './dto/query-appointment-dto';

@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Public()
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(@Query() queryDto: QueryAppointmentDto) {
    return this.appointmentsService.findAll(queryDto);
  }

  @Get('me')
  @UseInterceptors(ClassSerializerInterceptor)
  findMyAppointments(@ActiveUser() user: User) {
    return this.appointmentsService.findForUser(user);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @ActiveUser() agent: User,
  ) {
    return this.appointmentsService.update(id, agent._id, updateAppointmentDto);
  }

  @Patch(':id/reassign-agent')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  @UseInterceptors(ClassSerializerInterceptor)
  reassignAgent(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() reassignAgentDto: ReassignAgentDto,
    @ActiveUser() agent: User,
  ) {
    return this.appointmentsService.reassignAgent(
      id,
      agent._id,
      reassignAgentDto.newAgentId,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id', ParseMongoIdPipe) id: string, @ActiveUser() agent: User) {
    return this.appointmentsService.remove(id, agent._id);
  }
}
