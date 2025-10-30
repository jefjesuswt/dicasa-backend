import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PropertyStatus, PropertyType } from '../entities/property.entity';
import { Type } from 'class-transformer';
import { CreatePropertyAddressDto } from './create-property-address.dto';
import { CreatePropertyFeaturesDto } from './create-property-features.dto';

export class UpdatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  images: string[];

  @IsNumber()
  @Min(0)
  bedrooms: number;

  @IsNumber()
  @Min(0)
  bathrooms: number;

  @IsNumber()
  @IsPositive()
  area: number;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsEnum(PropertyStatus)
  status: PropertyStatus;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ValidateNested()
  @Type(() => CreatePropertyAddressDto)
  address: CreatePropertyAddressDto;

  @IsMongoId()
  @IsOptional()
  agentId: string;

  @ValidateNested()
  @Type(() => CreatePropertyFeaturesDto)
  @IsOptional()
  features?: CreatePropertyFeaturesDto;
}
