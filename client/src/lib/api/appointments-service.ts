import { BaseApi } from './base-api';

export interface Appointment {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  patient?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    }
  };
  doctor?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    }
  };
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  endTime: string;
  notes?: string;
}

export class AppointmentsService extends BaseApi {
  async getAppointments(): Promise<Appointment[]> {
    const response = await this.get<Appointment[]>('/appointments');
    return response.data;
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await this.get<Appointment>(`/appointments/${id}`);
    return response.data;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    const response = await this.get<Appointment[]>(`/appointments/patient/${patientId}`);
    return response.data;
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    const response = await this.get<Appointment[]>(`/appointments/doctor/${doctorId}`);
    return response.data;
  }

  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    const response = await this.post<Appointment>('/appointments', data);
    return response.data;
  }

  async updateAppointment(id: string, data: Partial<CreateAppointmentDto>): Promise<Appointment> {
    const response = await this.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  }

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    const response = await this.patch<Appointment>(`/appointments/${id}/status`, { status });
    return response.data;
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.delete(`/appointments/${id}`);
  }
}

export const appointmentsService = new AppointmentsService();