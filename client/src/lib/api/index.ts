export * from './base-api';
export * from './patient-service';
export * from './doctor-service';
export * from './medical-records-service';
export * from './vital-signs-service';
export * from './appointments-service';
export * from './notifications-service';
export * from './blockchain-service';

// Export a services object for convenience
import { patientService } from './patient-service';
import { doctorService } from './doctor-service';
import { medicalRecordsService } from './medical-records-service';
import { vitalSignsService } from './vital-signs-service';
import { appointmentsService } from './appointments-service';
import { notificationsService } from './notifications-service';
import { blockchainService } from './blockchain-service';

export const services = {
  patient: patientService,
  doctor: doctorService,
  medicalRecords: medicalRecordsService,
  vitalSigns: vitalSignsService,
  appointments: appointmentsService,
  notifications: notificationsService,
  blockchain: blockchainService,
};