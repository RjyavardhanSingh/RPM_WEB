import { BaseApi } from './base-api';

export interface MedicalRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  doctorId: string;
  title: string;
  description: string;
  diagnosis?: string;
  treatmentPlan?: string;
  medications?: string;
  notes?: string;
  blockchainTxHash?: string;
  files?: MedicalRecordFile[];
}

export interface MedicalRecordFile {
  id: string;
  createdAt: string;
  updatedAt: string;
  recordId: string;
  name: string;
  fileType: string;
  ipfsHash: string;
  size: number;
  blockchainTxHash?: string;
}

export interface CreateMedicalRecordDto {
  patientId: string;
  doctorId: string;
  title: string;
  description: string;
  diagnosis?: string;
  treatmentPlan?: string;
  medications?: string;
  notes?: string;
}

export class MedicalRecordsService extends BaseApi {
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    const response = await this.get<MedicalRecord[]>('/medical-records');
    return response.data;
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord> {
    const response = await this.get<MedicalRecord>(`/medical-records/${id}`);
    return response.data;
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    const response = await this.get<MedicalRecord[]>(`/medical-records/patient/${patientId}`);
    return response.data;
  }

  async createMedicalRecord(data: CreateMedicalRecordDto): Promise<MedicalRecord> {
    const response = await this.post<MedicalRecord>('/medical-records', data);
    return response.data;
  }

  async updateMedicalRecord(id: string, data: Partial<CreateMedicalRecordDto>): Promise<MedicalRecord> {
    const response = await this.patch<MedicalRecord>(`/medical-records/${id}`, data);
    return response.data;
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    await this.delete(`/medical-records/${id}`);
  }

  // Medical Record Files
  async uploadFile(recordId: string, file: File): Promise<MedicalRecordFile> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.post<MedicalRecordFile>(
      `/medical-records/${recordId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async getFiles(recordId: string): Promise<MedicalRecordFile[]> {
    const response = await this.get<MedicalRecordFile[]>(`/medical-records/${recordId}/files`);
    return response.data;
  }

  async deleteFile(recordId: string, fileId: string): Promise<void> {
    await this.delete(`/medical-records/${recordId}/files/${fileId}`);
  }

  async verifyFile(fileId: string): Promise<{ verified: boolean; message: string }> {
    const response = await this.get<{ verified: boolean; message: string }>(`/medical-records/files/${fileId}/verify`);
    return response.data;
  }
}

export const medicalRecordsService = new MedicalRecordsService();