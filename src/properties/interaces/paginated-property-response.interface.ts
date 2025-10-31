import { Property } from '../entities/property.entity';

export interface PaginatedPropertyResponse {
  data: Property[];
  total: number;
  page: number;
  limit: number;
}
