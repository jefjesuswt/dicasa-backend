import { User } from '../../users/entities/user.entity';
import { JwtResponse } from '../interfaces/jwt-response.interface';

export class AuthResponseDto {
  user: User;
  token: JwtResponse;
}
