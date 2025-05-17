import { BaseApi } from './base-api';
import { Patient } from './patient-service'; // Import from patient service

// Define interfaces for doctor-patient relationship data
export interface DoctorPatient {
  id: string;
  doctorId: string;
  patientId: string;
  status: string; // PENDING, ACTIVE, REVOKED
  connectionCode?: string; // Add this field
  blockchainTxHash?: string; // Add this field too
  createdAt?: string;
  updatedAt?: string;
  doctor?: {
    id: string;
    userId: string;
    specialization: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  patient?: {
    id: string;
    userId: string;
    name: string;
    email: string;
  };
}

export class PatientDoctorsService extends BaseApi {
  /**
   * Get all patients assigned to the current doctor
   */
  async getMyPatients(): Promise<DoctorPatient[]> {
    try {
      const response = await this.get('/patient-doctors/my-patients') as { data: DoctorPatient[] };
      return response.data;
    } catch (error) {
      console.error('Error fetching my patients:', error);
      // Return empty array as fallback for demo purposes
      return [];
    }
  }

  /**
   * Get all doctors assigned to the current patient
   */
  async getMyDoctors(): Promise<DoctorPatient[]> {
    try {
      const response = await this.get('/patient-doctors/my-doctors') as { data: DoctorPatient[] };
      return response.data;
    } catch (error) {
      console.error('Error fetching my doctors:', error);
      // Return empty array as fallback for demo purposes
      return [];
    }
  }

  /**
   * Request access to a patient (doctor initiates)
   */
  async requestAccess(patientId: string): Promise<DoctorPatient> {
    const response = await this.post('/patient-doctors/request', { patientId }) as { data: DoctorPatient };
    return response.data;
  }

  /**
   * Request access to a patient via wallet address (doctor initiates)
   */
  async requestAccessByWallet(patientWalletAddress: string): Promise<DoctorPatient> {
    const response = await this.post('/patient-doctors/request-by-wallet', { patientWalletAddress }) as { data: DoctorPatient };
    return response.data;
  }

  /**
   * Grant access to a doctor (patient initiates)
   */
  async grantAccess(doctorId: string): Promise<DoctorPatient> {
    const response = await this.post('/patient-doctors/grant', { doctorId }) as { data: DoctorPatient };
    return response.data;
  }

  /**
   * Verify and approve a connection (patient initiates)
   */
  async verifyAndApproveConnection(connectionId: string, signature: string): Promise<DoctorPatient> {
    const response = await this.post('/patient-doctors/verify-approve', { 
      connectionId, 
      signature 
    }) as { data: DoctorPatient };
    return response.data;
  }

  /**
   * Revoke a doctor's access to patient data
   */
  async revokeAccess(connectionId: string): Promise<void> {
    await this.post('/patient-doctors/revoke', { connectionId });
  }
}

export const patientDoctorsService = new PatientDoctorsService();