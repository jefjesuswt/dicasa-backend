import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { PropertiesModule } from '../properties/properties.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import {
  Property,
  PropertySchema,
} from '../properties/entities/property.entity';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    forwardRef(() => AppointmentsModule),
    forwardRef(() => PropertiesModule),
    StorageModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
