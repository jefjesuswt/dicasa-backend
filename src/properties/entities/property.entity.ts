import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Exclude, Transform, Type } from 'class-transformer';
import { AgentProfileDto } from '../../users/dto/agent-profile.dto';

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  LAND = 'land',
  COMMERCIAL = 'commercial',
}

export enum PropertyStatus {
  SALE = 'sale',
  RENT = 'rent',
  SOLD = 'sold',
  RENTED = 'rented',
}

@Schema({ _id: false })
export class PropertyFeatures {
  @Prop({ default: false })
  hasParking: boolean;

  @Prop({ default: false })
  hasFurniture: boolean;

  @Prop({ default: false })
  hasPool: boolean;

  @Prop({ default: false })
  hasGarden: boolean;

  @Prop({ default: false })
  isPetFriendly: boolean;
}

@Schema({ _id: false })
export class PropertyAddress {
  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true, default: 'Venezuela' })
  country: string;
}

@Schema({
  timestamps: true,
})
export class Property {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [String], required: true, default: [] })
  images: string[];

  @Prop({ required: true })
  bedrooms: number;

  @Prop({ required: true })
  bathrooms: number;

  @Prop({ required: true })
  area: number; // en m²

  @Prop({ required: true, enum: PropertyType, index: true })
  type: PropertyType;

  @Prop({ required: true, enum: PropertyStatus, index: true })
  status: PropertyStatus;

  @Prop({ default: false, index: true })
  featured: boolean;

  @Prop({ type: PropertyAddress, required: true })
  address: PropertyAddress;

  @Prop({ type: PropertyFeatures, required: false })
  features?: PropertyFeatures;

  @Type(() => AgentProfileDto)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  agent: User;

  @Exclude()
  __v: number;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

PropertySchema.index({
  title: 'text',
  description: 'text',
  'address.city': 'text',
  'address.state': 'text',
});

PropertySchema.index({ price: 1, status: 1 });
PropertySchema.index({ 'address.city': 1 });
PropertySchema.index({ 'address.state': 1 });
