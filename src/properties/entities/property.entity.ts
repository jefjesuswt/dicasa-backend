import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Transform } from 'class-transformer';

@Schema()
export class Property {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false, default: null })
  imageUrls?: string[];

  @Prop({ default: true })
  isActive: boolean;

  isForRent: boolean;
  isForSale: boolean;

  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  __v: number;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
