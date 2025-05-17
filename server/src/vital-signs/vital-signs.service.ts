import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { VitalSign } from '@prisma/client';

@Injectable()
export class VitalSignsService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private notificationsService: NotificationsService
  ) {}

  async create(createVitalSignDto: CreateVitalSignDto & { userId: string }): Promise<VitalSign> {
    const { patientId, userId, ...rest } = createVitalSignDto;

    // Verify patient exists and get associated user
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true
      }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Find the doctor assigned to this patient through medical records
    // This requires a separate query since there's no direct patient->doctor relationship
    const patientDoctor = await this.prisma.medicalRecord.findFirst({
      where: { 
        patientId,
        doctorId: { not: null }
      },
      select: {
        doctor: {
          include: {
            user: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Store data on blockchain for integrity verification
    const blockchainData = {
      action: 'vital_sign_added',
      patientId: patientId,
      userId: userId,
      data: rest,
      timestamp: new Date().toISOString()
    };

    const blockchainTxHash = await this.blockchainService.storeDataOnChain(blockchainData);

    // Create vital sign record
    const vitalSign = await this.prisma.vitalSign.create({
      data: {
        ...rest,
        patientId,
        userId,
        blockchainTxHash,
      },
    });

    // Check for abnormal values and send notifications
    try {
      const isAbnormal = this.checkForAbnormalValues(vitalSign);
      
      if (isAbnormal.abnormal && patientDoctor?.doctor?.user?.id) {
        await this.notificationsService.createVitalSignAlert(
          patientDoctor.doctor.user.id,
          patient.user?.name || 'a patient',
          vitalSign.id,
          isAbnormal.metric || 'vital sign',
          isAbnormal.value ?? 0
        );
      }
    } catch (error) {
      console.error('Failed to send vital sign alert:', error);
      // Don't fail the vital sign creation if notification fails
    }

    return vitalSign;
  }

  // Helper function to check for abnormal vital sign values
  private checkForAbnormalValues(vitalSign: VitalSign): { abnormal: boolean; metric?: string; value?: number } {
    // Check heart rate (normal range: 60-100 bpm)
    if (vitalSign.heartRate && (vitalSign.heartRate < 60 || vitalSign.heartRate > 100)) {
      return { abnormal: true, metric: 'heart rate', value: vitalSign.heartRate };
    }
    
    // Check blood pressure (normal systolic range: 90-120 mmHg)
    if (vitalSign.bloodPressureSystolic && 
        (vitalSign.bloodPressureSystolic < 90 || vitalSign.bloodPressureSystolic > 140)) {
      return { abnormal: true, metric: 'systolic blood pressure', value: vitalSign.bloodPressureSystolic };
    }
    
    // Check blood pressure (normal diastolic range: 60-80 mmHg)
    if (vitalSign.bloodPressureDiastolic && 
        (vitalSign.bloodPressureDiastolic < 60 || vitalSign.bloodPressureDiastolic > 90)) {
      return { abnormal: true, metric: 'diastolic blood pressure', value: vitalSign.bloodPressureDiastolic };
    }
    
    // FIXED: Changed bloodOxygen to oxygenSaturation to match the Prisma schema
    if (vitalSign.oxygenSaturation && vitalSign.oxygenSaturation < 95) {
      return { abnormal: true, metric: 'oxygen saturation', value: vitalSign.oxygenSaturation };
    }
    
    // Check temperature (normal range: 36.1-37.2°C)
    if (vitalSign.temperature && (vitalSign.temperature < 36.1 || vitalSign.temperature > 38)) {
      return { abnormal: true, metric: 'temperature', value: vitalSign.temperature };
    }
    
    // No abnormal values found
    return { abnormal: false };
  }

  async findAll(): Promise<VitalSign[]> {
    return this.prisma.vitalSign.findMany({
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async findByPatientId(patientId: string): Promise<VitalSign[]> {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true
      }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    return this.prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<VitalSign> {
    const vitalSign = await this.prisma.vitalSign.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!vitalSign) {
      throw new NotFoundException(`Vital sign with ID ${id} not found`);
    }

    return vitalSign;
  }

  async update(id: string, updateVitalSignDto: UpdateVitalSignDto): Promise<VitalSign> {
    const vitalSign = await this.prisma.vitalSign.findUnique({
      where: { id },
    });

    if (!vitalSign) {
      throw new NotFoundException(`Vital sign with ID ${id} not found`);
    }

    // Update vital sign and record the change on blockchain
    const updatedData = {
      ...vitalSign,
      ...updateVitalSignDto,
      updatedAt: new Date(),
    };

    // Store update on blockchain
    const blockchainTxHash = await this.blockchainService.storeDataOnChain({
      action: 'update',
      id,
      previousHash: vitalSign.blockchainTxHash,
      newData: updatedData,
    });

    // Update vital sign with new blockchain reference
    return this.prisma.vitalSign.update({
      where: { id },
      data: {
        ...updateVitalSignDto,
        blockchainTxHash,
      },
    });
  }

  async verifyBlockchainRecord(id: string): Promise<{ isVerified: boolean; details: any }> {
    const vitalSign = await this.prisma.vitalSign.findUnique({
      where: { id },
    });

    if (!vitalSign) {
      throw new NotFoundException(`Vital sign with ID ${id} not found`);
    }

    if (!vitalSign.blockchainTxHash) {
      return { isVerified: false, details: 'No blockchain record exists for this vital sign' };
    }

    // Verify the data on the blockchain
    const isVerified = await this.blockchainService.verifyDataOnChain(
      vitalSign.blockchainTxHash,
      vitalSign,
    );

    return {
      isVerified,
      details: {
        recordId: id,
        blockchainTxHash: vitalSign.blockchainTxHash,
        timestamp: vitalSign.timestamp,
      },
    };
  }
}