import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecord, Role } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private notificationsService: NotificationsService, // Inject the notifications service
  ) {}

  async create(createMedicalRecordDto: CreateMedicalRecordDto, userId: string): Promise<MedicalRecord> {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createMedicalRecordDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${createMedicalRecordDto.patientId} not found`);
    }

    // Verify doctor if doctorId is provided
    if (createMedicalRecordDto.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: createMedicalRecordDto.doctorId },
      });

      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${createMedicalRecordDto.doctorId} not found`);
      }
    }

    // Create medical record data with createdById
    const recordData = {
      ...createMedicalRecordDto,
      createdById: userId,
    };

    // Store on blockchain
    const blockchainTxHash = await this.blockchainService.storeDataOnChain({
      ...recordData,
      timestamp: new Date().toISOString(),
    });

    // Save medical record with blockchain transaction hash
    return this.prisma.medicalRecord.create({
      data: {
        ...recordData,
        blockchainTxHash,
      },
    });
  }

  async findAll(): Promise<MedicalRecord[]> {
    return this.prisma.medicalRecord.findMany({
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async findByPatientId(patientId: string): Promise<MedicalRecord[]> {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    return this.prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<MedicalRecord> {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Medical record with ID ${id} not found`);
    }

    return record;
  }

  async update(id: string, updateMedicalRecordDto: UpdateMedicalRecordDto, userId: string): Promise<MedicalRecord> {
    // Check if record exists and get current data
    const existingRecord = await this.findOne(id);

    // Get user to check role
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    // Only allow creators, doctors assigned to the record, or admins to update
    const canUpdate = 
      existingRecord.createdById === userId || 
      existingRecord.doctorId === user?.id || 
      user?.role === Role.ADMIN;
      
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this record');
    }

    // Store update operation on blockchain for integrity verification
    const blockchainData = {
      action: 'medical_record_updated',
      recordId: id,
      updates: updateMedicalRecordDto,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    };
    
    const blockchainTxHash = await this.blockchainService.storeDataOnChain(blockchainData);

    const updatedRecord = await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        ...updateMedicalRecordDto,
        blockchainTxHash,
      },
      include: {
        patient: {
          include: {
            user: true 
          }
        },
        doctor: {
          include: {
            user: true
          }
        }
      }
    });
    
    // Send notifications
    try {
      // Notify the patient about the update
      if (updatedRecord.patient?.user) {
        await this.notificationsService.createMedicalRecordUpdate(
          updatedRecord.patient.user.id,
          updatedRecord.patient.user.name || 'Unknown patient',
          id
        );
      }
      
      // Also notify the doctor if different from updater
      if (updatedRecord.doctor?.user && updatedRecord.doctor.user.id !== userId) {
        await this.notificationsService.createMedicalRecordUpdate(
          updatedRecord.doctor.user.id,
          updatedRecord.patient.user.name || 'a patient',
          id
        );
      }
    } catch (error) {
      console.error('Failed to send medical record update notifications:', error);
      // Don't fail the update if notifications fail
    }
    
    return updatedRecord;
  }

  async remove(id: string, userId: string): Promise<MedicalRecord> {
    // Check if record exists
    const record = await this.findOne(id);
    
    // Get user to check role
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    // Only allow admins to delete records
    if (user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can delete medical records');
    }

    return this.prisma.medicalRecord.delete({
      where: { id },
    });
  }

  async verifyIntegrity(id: string): Promise<{ isVerified: boolean; record: MedicalRecord }> {
    const record = await this.findOne(id);
    
    if (!record.blockchainTxHash) {
      return { isVerified: false, record };
    }
    
    const isVerified = await this.blockchainService.verifyDataOnChain(
      record.blockchainTxHash,
      {
        patientId: record.patientId,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        medication: record.medication,
        notes: record.notes,
        createdById: record.createdById,
        doctorId: record.doctorId,
      }
    );
    
    return { isVerified, record };
  }}
