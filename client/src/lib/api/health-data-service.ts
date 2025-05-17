import { BaseApi } from './base-api';
import { VitalSign } from './vital-signs-service';

export interface HealthReading {
  id: string;
  patientId: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthDataResponse {
  data: HealthReading[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class HealthDataService extends BaseApi {
  async getMyHealthData(): Promise<HealthDataResponse> {
    // Fix: Use await to properly extract the data
    const response = await this.api.get<HealthDataResponse>('/health-data');
    return response.data;
  }

  async getPatientHealthData(patientId: string): Promise<HealthDataResponse> {
    // Fix: Use await to properly extract the data
    const response = await this.api.get<HealthDataResponse>(`/health-data/patients/${patientId}`);
    return response.data;
  }
  
  // This method converts HealthReadings to the VitalSign format
  convertToVitalSigns(response: HealthDataResponse): VitalSign {
    // Fix: Accept the actual API response structure and extract readings
    const readings = response.data || [];
    
    if (readings.length === 0) {
      // Handle empty readings case
      return {
        id: 'derived-empty',
        patientId: '',
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        heartRate: undefined,
        bloodPressureSystolic: undefined,
        bloodPressureDiastolic: undefined,
        temperature: undefined,
        oxygenSaturation: undefined,
      };
    }
    
    // Group readings by type with proper typing and empty initial object
    const grouped: Record<string, HealthReading> = readings.reduce((acc: Record<string, HealthReading>, reading) => {
      acc[reading.type] = reading;
      return acc;
    }, {} as Record<string, HealthReading>);
    
    // Create a VitalSign object using undefined instead of null to match the interface
    return {
      id: 'derived',
      patientId: readings[0]?.patientId || '',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: readings[0]?.timestamp || new Date().toISOString(),
      // Fix: Use undefined instead of null to match VitalSign interface
      heartRate: grouped['HEART_RATE']?.value,
      bloodPressureSystolic: grouped['BLOOD_PRESSURE_SYSTOLIC']?.value,
      bloodPressureDiastolic: grouped['BLOOD_PRESSURE_DIASTOLIC']?.value,
      temperature: grouped['TEMPERATURE']?.value,
      oxygenSaturation: grouped['BLOOD_OXYGEN']?.value,
    };
  }
}