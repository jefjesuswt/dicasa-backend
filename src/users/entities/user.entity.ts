import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Transform } from 'class-transformer';

@Schema()
export class User {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Exclude()
  @Prop({ required: true, minLength: 6 })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  phoneNumber: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: [String],
    enum: ['USER', 'ADMIN', 'SUPERADMIN'],
    default: ['USER'],
  })
  roles: string[];

  @Exclude()
  @Prop({ type: String, required: false, select: false })
  passwordResetToken?: string;

  @Exclude()
  @Prop({ type: Date, required: false, select: false })
  passwordResetExpires?: Date;

  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  __v: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
