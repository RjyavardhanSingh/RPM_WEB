import { Injectable, NotFoundException, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorPatient, Prisma } from '@prisma/client'; // Import DoctorPatient type from generated Prisma client
import { NotificationsService } from '../notifications/notifications.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import * as crypto from 'crypto';

@Injectable()
export class PatientDoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  // Replace the helper method with a better typed version
  private get doctorPatientModel() {
    return this.prisma.doctorPatient;
  }

  async requestDoctorAccess(patientId: string, doctorId: string): Promise<DoctorPatient> {
    // Check if patient and doctor exist
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Check if a connection already exists or is pending
    const existingConnection = await this.doctorPatientModel.findUnique({
      where: { doctorId_patientId: { doctorId, patientId } },
    });

    if (existingConnection) {
      if (existingConnection.status === 'ACTIVE') {
        throw new ConflictException('Access already granted.');
      } else if (existingConnection.status === 'PENDING') {
        throw new ConflictException('Access request already pending.');
      } else if (existingConnection.status === 'REVOKED') {
        // If revoked, allow a new request by updating status to PENDING
        return this.doctorPatientModel.update({
          where: { id: existingConnection.id },
          data: { status: 'PENDING', updatedAt: new Date() },
        });
      }
    }

    // Create new pending request
    return this.doctorPatientModel.create({
      data: {
        patientId,
        doctorId,
        status: 'PENDING',
      },
    });
  }

  async grantDoctorAccess(doctorId: string, patientId: string, grantingUserId: string): Promise<DoctorPatient> {
    const connection = await this.doctorPatientModel.findUnique({
      where: { doctorId_patientId: { doctorId, patientId } },
      include: { doctor: true },
    });

    if (!connection) {
      throw new NotFoundException('Access request not found.');
    }

    // Ensure the user granting access is the doctor in question
    if (connection.doctor.userId !== grantingUserId) {
      throw new UnauthorizedException('You are not authorized to grant this access.');
    }

    if (connection.status !== 'PENDING') {
      throw new ConflictException(`Request is not in PENDING state (current state: ${connection.status}).`);
    }

    const updatedConnection = await this.doctorPatientModel.update({
      where: { id: connection.id },
      data: { status: 'ACTIVE', updatedAt: new Date() },
    });

    // TODO: Record consent on blockchain
    // try {
    //   const consentData = `Patient ${patientId} granted access to Doctor ${doctorId} at ${new Date().toISOString()}`;
    //   const txHash = await this.blockchainService.recordConsent(patientId, doctorId, consentData);
    //   await this.prisma.doctorPatient.update({
    //     where: { id: updatedConnection.id },
    //     data: { blockchainTxHash: txHash },
    //   });
    // } catch (error) {
    //   console.error('Blockchain consent recording failed:', error);
    //   // Decide if this should be a critical failure or just logged
    // }

    return updatedConnection;
  }

  async revokeDoctorAccess(accessorId: string, doctorPatientId: string, revokingUserId: string, revokingUserRole: string): Promise<DoctorPatient> {
    const connection = await this.doctorPatientModel.findUnique({
      where: { id: doctorPatientId },
      include: { patient: true, doctor: true },
    });

    if (!connection) {
      throw new NotFoundException('Doctor-Patient connection not found.');
    }

    // Authorization: Either the patient or the doctor in the connection can revoke.
    const isPatient = revokingUserRole === 'PATIENT' && connection.patient.userId === revokingUserId;
    const isDoctor = revokingUserRole === 'DOCTOR' && connection.doctor.userId === revokingUserId;

    if (!isPatient && !isDoctor) {
      throw new UnauthorizedException('You are not authorized to revoke this access.');
    }
    
    if (connection.status === 'REVOKED') {
        throw new ConflictException('Access already revoked.');
    }

    return this.doctorPatientModel.update({
      where: { id: connection.id },
      data: { status: 'REVOKED', updatedAt: new Date() },
    });
  }

  async getConnectionsForPatient(patientUserId: string): Promise<DoctorPatient[]> {
    const patient = await this.prisma.patient.findUnique({ where: { userId: patientUserId }});
    if (!patient) {
        throw new NotFoundException('Patient not found');
    }
    return this.doctorPatientModel.findMany({
      where: { patientId: patient.id },
      include: { doctor: { include: { user: { select: { name: true, email: true }} } } },
    });
  }

  async getConnectionsForDoctor(doctorUserId: string): Promise<DoctorPatient[]> {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId }});
    if (!doctor) {
        throw new NotFoundException('Doctor not found');
    }
    return this.doctorPatientModel.findMany({
      where: { doctorId: doctor.id },
      include: { 
        patient: { 
          select: {
            id: true,
            dateOfBirth: true,
            gender: true,
            user: {
              select: { 
                name: true, 
                email: true 
              }
            }
          }
        } 
      },
    });
  }

  async getActiveConnection(patientId: string, doctorId: string): Promise<DoctorPatient | null> {
    return this.doctorPatientModel.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'ACTIVE',
      },
    });
  }

  async requestAccessByWallet(doctorId: string, patientWalletAddress: string) {
    // Find patient by wallet address
    const patient = await this.prisma.user.findFirst({
      where: { walletAddress: patientWalletAddress.toLowerCase() },
      include: { patient: true }
    });
    
    if (!patient?.patient) {
      throw new NotFoundException('No patient found with this wallet address');
    }
    
    // Generate a unique connection code for verification
    const connectionCode = crypto.randomBytes(16).toString('hex');
    
    // Create a pending connection
    const connection = await this.doctorPatientModel.create({
      data: {
        doctorId,
        patientId: patient.patient.id,
        status: 'PENDING',
        connectionCode,
      }
    });
    
    // Create notification for the patient
    await this.notificationsService.create({
      userId: patient.id,
      title: 'Connection Request',
      message: 'A doctor has requested to connect with your wallet address',
      type: 'CONNECTION_REQUEST' as any, // Type assertion as temporary fix
      relatedId: connection.id
    });
    
    return connection;
  }

  async verifyAndApproveConnection(connectionId: string, signature: string, patientId: string) {
    const connection = await this.doctorPatientModel.findUnique({
      where: { id: connectionId },
      include: { doctor: true }
    });
    
    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }
    
    if (connection.patientId !== patientId) {
      throw new UnauthorizedException('This connection request is not for you');
    }
    
    // Add this null check
    if (!connection.connectionCode) {
      throw new BadRequestException('Connection code is missing');
    }
    
    // Now connectionCode is guaranteed to be a string
    const isValid = await this.blockchainService.verifySignature(
      connection.connectionCode,
      signature,
      patientId
    );
    
    // Record the verification on blockchain
    const blockchainTxHash = await this.blockchainService.storeDataOnChain({
      action: 'connection_approved',
      doctorId: connection.doctorId,
      patientId: connection.patientId,
      timestamp: new Date().toISOString(),
      signatureVerified: true
    });
    
    // Update the connection status
    return this.doctorPatientModel.update({
      where: { id: connectionId },
      data: {
        status: 'ACTIVE',
        blockchainTxHash
      }
    });
  }

  /**
   * Get all patients connected to the current doctor
   */
  async getMyPatients(doctorId: string) {
    // Get all active connections for this doctor
    const connections = await this.prisma.doctorPatient.findMany({
      where: {
        doctorId: doctorId,
        status: 'ACTIVE'
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return connections;
  }
}
