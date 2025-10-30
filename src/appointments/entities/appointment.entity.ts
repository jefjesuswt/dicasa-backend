import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
})
export class Appointment {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Type(() => Property)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true,
  })
  property: Property;

  @Type(() => User)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  agent: User;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
    index: true,
  })
  status: AppointmentStatus;

  @Prop({ required: true, index: true })
  appointmentDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
