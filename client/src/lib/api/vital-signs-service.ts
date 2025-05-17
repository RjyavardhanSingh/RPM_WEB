import { BaseApi } from './base-api';

export interface VitalSign {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  userId: string;
  timestamp: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  notes?: string;
  blockchainTxHash?: string;
}

export interface CreateVitalSignDto {
  patientId: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  notes?: string;
}

export class VitalSignsService extends BaseApi {
  async getVitalSigns(): Promise<VitalSign[]> {
    const response = await this.get<VitalSign[]>('/vital-signs');
    return response.data;
  }

  async getVitalSignById(id: string): Promise<VitalSign> {
    const response = await this.get<VitalSign>(`/vital-signs/${id}`);
    return response.data;
  }

  async getVitalSignsByPatient(patientId: string): Promise<VitalSign[]> {
    const response = await this.get<VitalSign[]>(`/vital-signs/patient/${patientId}`);
    return response.data;
  }

  async getLatestVitalSigns(patientId: string): Promise<VitalSign> {
    const response = await this.get<VitalSign>(`/vital-signs/patient/${patientId}/latest`);
    return response.data;
  }

  async createVitalSign(data: CreateVitalSignDto): Promise<VitalSign> {
    const response = await this.post<VitalSign>('/vital-signs', data);
    return response.data;
  }

  async updateVitalSign(id: string, data: Partial<CreateVitalSignDto>): Promise<VitalSign> {
    const response = await this.patch<VitalSign>(`/vital-signs/${id}`, data);
    return response.data;
  }

  async deleteVitalSign(id: string): Promise<void> {
    await this.delete(`/vital-signs/${id}`);
  }

  async verifyVitalSign(id: string): Promise<{ verified: boolean; message: string }> {
    const response = await this.get<{ verified: boolean; message: string }>(`/vital-signs/${id}/verify`);
    return response.data;
  }
}

export const vitalSignsService = new VitalSignsService();