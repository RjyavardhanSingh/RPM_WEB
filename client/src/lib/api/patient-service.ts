import { BaseApi } from './base-api';

export interface Patient {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  allergies?: string;
  medicalHistory?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreatePatientDto {
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  allergies?: string;
  medicalHistory?: string;
}

export class PatientService extends BaseApi {
  async getPatients(): Promise<Patient[]> {
    const response = await this.get<Patient[]>('/patients');
    return response.data;
  }

  async getPatientById(id: string): Promise<Patient> {
    const response = await this.get<Patient>(`/patients/${id}`);
    return response.data;
  }

  async getPatientProfile(): Promise<Patient> {
    const response = await this.get<Patient>('/patients/profile');
    return response.data;
  }

  async createPatient(data: CreatePatientDto): Promise<Patient> {
    const response = await this.post<Patient>('/patients', data);
    return response.data;
  }

  async updatePatient(id: string, data: Partial<CreatePatientDto>): Promise<Patient> {
    const response = await this.patch<Patient>(`/patients/${id}`, data);
    return response.data;
  }

  async deletePatient(id: string): Promise<void> {
    await this.delete(`/patients/${id}`);
  }
}

export const patientService = new PatientService();