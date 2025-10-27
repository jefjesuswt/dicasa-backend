import { IsBoolean, IsOptional } from 'class-validator';

export class CreatePropertyFeaturesDto {
  @IsBoolean()
  @IsOptional()
  hasParking?: boolean;

  @IsBoolean()
  @IsOptional()
  hasFurniture?: boolean;

  @IsBoolean()
  @IsOptional()
  hasPool?: boolean;

  @IsBoolean()
  @IsOptional()
  hasGarden?: boolean;

  @IsBoolean()
  @IsOptional()
  isPetFriendly?: boolean;
}
