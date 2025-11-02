import { Appointment } from '../entities/appointment.entity';

export interface PaginatedAppointmentResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
}
