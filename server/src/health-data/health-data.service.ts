import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Update this import to use createHealthReadingDto but import ReadingType from Prisma
import { CreateHealthReadingDto } from './dto/create-health-reading.dto';  
import { Role, Prisma, HealthReading, ReadingType } from '@prisma/client'; // Import ReadingType from Prisma
import { PatientDoctorsService } from '../patient-doctors/patient-doctors.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class HealthDataService {
  constructor(
    private prisma: PrismaService,
    private patientDoctorsService: PatientDoctorsService, 
    private blockchainService: BlockchainService, 
  ) {}

  // Create a new health reading
  async createReading(userId: string, dto: CreateHealthReadingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Accept both USER and PATIENT roles for the presentation
    if (user.role !== Role.PATIENT && user.role !== Role.USER) {
      throw new ForbiddenException('Only patients can submit health readings');
    }

    return this.prisma.healthReading.create({
      data: {
        patientId: userId,
        type: dto.type,
        value: dto.value,
        unit: dto.unit,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      }
    });
  }

  // Create multiple readings in a batch
  async createBatchReadings(userId: string, dtos: CreateHealthReadingDto[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Accept both USER and PATIENT roles for the presentation
    if (user.role !== Role.PATIENT && user.role !== Role.USER) {
      throw new ForbiddenException('Only patients can submit health readings');
    }

    // Use Prisma transaction for batch insert
    return this.prisma.$transaction(
      dtos.map(dto => this.prisma.healthReading.create({
        data: {
          patientId: userId,
          type: dto.type,
          value: dto.value,
          unit: dto.unit,
          timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
        }
      }))
    );
  }

  // Store health readings (used by mobile app)
  async storeHealthReadings(userId: string, readings: any[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Accept all roles for simplicity during the presentation
    return this.prisma.$transaction(
      readings.map(reading => this.prisma.healthReading.create({
        data: {
          patientId: userId,
          type: reading.type,
          value: reading.value,
          unit: reading.unit,
          timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date(),
        }
      }))
    );
  }

  // Create a health reading and store it on blockchain
  async createHealthReading(dto: CreateHealthReadingDto): Promise<HealthReading> {
    // Save the reading to the database with explicit fields
    const reading = await this.prisma.healthReading.create({
      data: {
        patientId: dto.patientId,
        type: dto.type,
        value: dto.value,
        unit: dto.unit,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
        // Any other fields your HealthReading model requires
      } as Prisma.HealthReadingUncheckedCreateInput, // Use unchecked input to bypass relation checks
    });
    
    // Store the data on blockchain for tamper-proof verification
    const blockchainTxHash = await this.blockchainService.storeDataOnChain({
      action: 'health_reading_created',
      readingId: reading.id,
      patientId: reading.patientId,
      type: reading.type,
      value: reading.value,
      unit: reading.unit,
      timestamp: reading.timestamp.toISOString()
    });
    
    // Update the reading with the blockchain transaction hash
    return this.prisma.healthReading.update({
      where: { id: reading.id },
      data: { blockchainTxHash } as any, // Use type assertion temporarily
    });
  }

  // Get health readings for the current user
  async getMyReadings(userId: string, limit = 100, page = 1, type?: ReadingType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Pagination setup
    const skip = (page - 1) * limit;

    // Query conditions
    const where = {
      patientId: userId,
      ...(type && { type }),
    };

    // Execute query with count
    const [readings, total] = await Promise.all([
      this.prisma.healthReading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.healthReading.count({ where }),
    ]);

    return {
      data: readings,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get readings for a specific patient (for doctorId)
  async getPatientReadings(requestingDoctorUserId: string, targetPatientUserId: string, limit = 100, page = 1, type?: ReadingType) {
    // Fetch Doctor profile
    const doctorProfile = await this.prisma.doctor.findUnique({
      where: { userId: requestingDoctorUserId },
    });
    if (!doctorProfile) {
      throw new NotFoundException(`Doctor profile not found for user ID ${requestingDoctorUserId}`);
    }

    // Fetch Patient profile
    const patientProfile = await this.prisma.patient.findUnique({
      where: { userId: targetPatientUserId },
    });
    if (!patientProfile) {
      throw new NotFoundException('Patient profile not found');
    }

    // Check for active connection using PatientDoctorsService
    const activeConnection = await this.patientDoctorsService.getActiveConnection(patientProfile.id, doctorProfile.id);
    if (!activeConnection) {
      throw new ForbiddenException(`Doctor (User ID: ${requestingDoctorUserId}) does not have active access to patient (User ID: ${targetPatientUserId})`);
    }

    // User (patient) whose readings are being fetched
    const patientUser = await this.prisma.user.findUnique({
      where: { id: targetPatientUserId },
    });

    if (!patientUser) {
      throw new NotFoundException('Patient user not found');
    }

    // Pagination setup
    const skip = (page - 1) * limit;

    // Query conditions - HealthReading.patientId refers to User.id
    const where = {
      patientId: targetPatientUserId, // This is correct as HealthReading.patientId is User.id
      ...(type && { type }),
    };

    // Execute query
    const [readings, total] = await Promise.all([
      this.prisma.healthReading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.healthReading.count({ where }),
    ]);

    return {
      data: readings,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Simpler version for mobile app (RENAMED TO AVOID DUPLICATE)
  async getPatientReadingsSimple(patientId: string) {
    return this.prisma.healthReading.findMany({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
    });
  }

  // Get all patients (for doctors)
  async getMyPatients(doctorId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId }
    });

    // For simplicity in your presentation, don't enforce doctor role
    // In production, you'd check: if (!doctor || doctor.role !== Role.DOCTOR) {
    
    // In a real app, you would have a doctor-patient relationship model
    // This is a simplified version that returns all patients
    return this.prisma.user.findMany({
      where: { role: Role.PATIENT },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  // Get latest vitals for a user
  async getLatestVitals(targetPatientUserId: string) { // targetPatientUserId is the User.id of the patient
    const userWithPatientProfile = await this.prisma.user.findUnique({
      where: { id: targetPatientUserId },
      include: { patient: true }, // To get patient.id for the VitalSign model
    });

    if (!userWithPatientProfile) {
      throw new NotFoundException(`User with ID ${targetPatientUserId} not found.`);
    }

    // For VitalSign model, which is linked via Patient.id
    const patientProfileId = userWithPatientProfile.patient?.id;
    let latestVitalSignData: Prisma.VitalSignGetPayload<{}> | null = null; // Corrected type, simplified include part

    if (patientProfileId) {
      latestVitalSignData = await this.prisma.vitalSign.findFirst({
        where: { patientId: patientProfileId }, // Query VitalSign by Patient.id
        orderBy: { timestamp: 'desc' },
      });
    } else {
      // If the user is a patient but has no linked patient profile, VitalSign data cannot be fetched by Patient.id.
      // This might be an data inconsistency or a user who hasn't completed patient onboarding.
      if (userWithPatientProfile.role === Role.PATIENT) {
        console.warn(`User ${targetPatientUserId} (PATIENT) does not have a linked patient profile. Data from VitalSign model might be incomplete.`);
      }
    }

    // For HealthReading model, which is linked via User.id (HealthReading.patientId)
    const latestReadings = await this.prisma.healthReading.findMany({
      where: { patientId: targetPatientUserId }, // Query HealthReading by User.id
      orderBy: { timestamp: 'desc' },
      take: 20, // Get a sufficient number of recent readings to find all types
    });

    const result: any = { // Consider defining a specific return type
      timestamp: new Date().toISOString(),
      ...(latestVitalSignData || {}), // Spread data from VitalSign model if available
    };

    // Populate from HealthReadings. These will fill in values if not present from latestVitalSignData
    // or if HealthReadings are more recent for specific types not covered by a single VitalSign entry.
    latestReadings.forEach(reading => {
      if (reading.type === ReadingType.HEART_RATE && result.heartRate === undefined) {
        result.heartRate = reading.value;
      } else if (reading.type === ReadingType.BLOOD_PRESSURE_SYSTOLIC && result.bloodPressureSystolic === undefined) {
        result.bloodPressureSystolic = reading.value;
      } else if (reading.type === ReadingType.BLOOD_PRESSURE_DIASTOLIC && result.bloodPressureDiastolic === undefined) {
        result.bloodPressureDiastolic = reading.value;
      } else if (reading.type === ReadingType.TEMPERATURE && result.temperature === undefined) {
        result.temperature = reading.value;
      } else if (reading.type === ReadingType.BLOOD_OXYGEN && result.oxygenSaturation === undefined) {
        // VitalSign model uses 'oxygenSaturation', HealthReading uses 'BLOOD_OXYGEN' type
        result.oxygenSaturation = reading.value;
      }
    });

    return result;
  }
}