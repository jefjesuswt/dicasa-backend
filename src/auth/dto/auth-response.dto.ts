import { User } from 'src/users/entities/user.entity';
import { JwtResponse } from '../interfaces/jwt-response.interface';

export class AuthResponseDto {
  user: User;
  token: JwtResponse;
}
