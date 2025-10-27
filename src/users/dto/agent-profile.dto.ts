import { Transform, Exclude, Expose } from 'class-transformer'; // <-- 1. Importa Exclude y Expose

@Exclude()
export class AgentProfileDto {
  @Expose()
  @Transform(({ value }) => value.toString())
  _id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  profileImageUrl?: string;

  @Expose()
  phoneNumber: string;
}
