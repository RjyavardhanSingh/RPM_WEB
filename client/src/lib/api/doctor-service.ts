import { BaseApi } from './base-api';

export interface Doctor {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  yearsOfExperience?: number;
  education?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateDoctorDto {
  userId: string;
  specialization: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  yearsOfExperience?: number;
  education?: string;
}

export class DoctorService extends BaseApi {
  async getDoctors(): Promise<Doctor[]> {
    const response = await this.get<Doctor[]>('/doctors');
    return response.data;
  }

  async getDoctorById(id: string): Promise<Doctor> {
    const response = await this.get<Doctor>(`/doctors/${id}`);
    return response.data;
  }

  async getDoctorProfile(): Promise<Doctor> {
    const response = await this.get<Doctor>('/doctors/profile');
    return response.data;
  }

  async createDoctor(data: CreateDoctorDto): Promise<Doctor> {
    const response = await this.post<Doctor>('/doctors', data);
    return response.data;
  }

  async updateDoctor(id: string, data: Partial<CreateDoctorDto>): Promise<Doctor> {
    const response = await this.patch<Doctor>(`/doctors/${id}`, data);
    return response.data;
  }

  async deleteDoctor(id: string): Promise<void> {
    await this.delete(`/doctors/${id}`);
  }

  async getPatients(doctorId: string): Promise<any[]> {
    const response = await this.get<any[]>(`/doctors/${doctorId}/patients`);
    return response.data;
  }
}

export const doctorService = new DoctorService();