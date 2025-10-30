import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ReassignAgentDto {
  @IsMongoId()
  @IsNotEmpty()
  newAgentId: string;
}
