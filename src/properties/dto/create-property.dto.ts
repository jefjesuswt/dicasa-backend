import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsArray,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyStatus, PropertyType } from '../entities/property.entity';
import { CreatePropertyAddressDto } from './create-property-address.dto';
import { CreatePropertyFeaturesDto } from './create-property-features.dto';

export class CreatePropertyDto {
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

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
