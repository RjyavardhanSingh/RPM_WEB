import { BaseApi } from './base-api';

export interface VitalSign {
  id: string;
  patientId: string;
  userId: string;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export class VitalSignsService extends BaseApi {
  /**
   * Get latest vital signs for a patient
   */
  async getLatestVitalSigns(patientId: string): Promise<VitalSign> {
    return this.get<VitalSign>(`/vital-signs/latest/${patientId}`);
  }
  
  /**
   * Get all vital signs for a patient
   */
  async getVitalSignsHistory(patientId: string): Promise<VitalSign[]> {
    return this.get<VitalSign[]>(`/vital-signs/history/${patientId}`);
  }
  
  /**
   * Record a new vital sign
   */
  async recordVitalSign(data: Partial<VitalSign>): Promise<VitalSign> {
    return this.post<VitalSign>('/vital-signs', data);
  }
}