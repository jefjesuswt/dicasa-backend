import { User } from '../entities/user.entity';

export interface PaginatedUserResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}
