import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PinataService } from '../pinata/pinata.service';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
// Correct the import for Express types
import type { Multer } from 'multer';
import type { Express } from 'express';
// Import the interfaces from the shared file
import { MedicalRecordFile, PinataMetadata } from './interfaces/medical-record-file.interface';

// Remove the previous interface definitions since we're importing them now

@Injectable()
export class MedicalRecordsFilesService {
  private readonly logger = new Logger(MedicalRecordsFilesService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private pinataService: PinataService,
  ) {}

  /**
   * Add a file to a medical record and store on IPFS
   */
  async addFileToMedicalRecord(
    recordId: string, 
    file: Express.Multer.File, // Use Express.Multer.File type
    userId: string
  ): Promise<{ message: string; file: MedicalRecordFile }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Verify record exists
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: true,
        doctor: true,
      }
    });

    if (!record) {
      throw new NotFoundException(`Medical record with ID ${recordId} not found`);
    }

    // Check user permissions (doctor for this patient, admin, or creator of record)
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        doctor: true,
      }
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const canAddFile = 
      user.role === Role.ADMIN || 
      record.createdById === userId ||
      (user.doctor && record.doctorId === user.doctor.id);

    if (!canAddFile) {
      throw new ForbiddenException('You do not have permission to add files to this record');
    }

    try {
      // Generate a unique file ID
      const fileId = uuidv4();
      
      // Upload to IPFS via Pinata
      const fileMetadata = await this.pinataService.uploadFile(file, {
        recordId,
        patientId: record.patientId,
        uploadedBy: userId,
        fileId,
      }) as PinataMetadata; // Cast to our interface for type safety
      
      if (!fileMetadata || !fileMetadata.ipfsHash) {
        throw new Error('Failed to upload file to IPFS');
      }
      
      // Store reference on blockchain for integrity verification
      const blockchainData = {
        action: 'medical_record_file_added',
        recordId,
        fileId,
        fileName: file.originalname,
        fileHash: fileMetadata.ipfsHash,
        mimeType: file.mimetype,
        size: file.size,
        timestamp: new Date().toISOString(),
        uploadedBy: userId
      };
      
      const blockchainTxHash = await this.blockchainService.storeDataOnChain(blockchainData) || null;
      
      // Create file object to store in medical record
      const fileObject: MedicalRecordFile = {
        id: fileId,
        name: file.originalname,
        ipfsHash: fileMetadata.ipfsHash,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        gatewayUrl: fileMetadata.gatewayUrl || this.pinataService.getGatewayUrl(fileMetadata.ipfsHash),
        blockchainTxHash,
      };
      
      // Use the utility function for consistent handling
      const attachments = this.safelyConvertAttachments(record.attachments, recordId);
      
      // Update medical record with the new file
      await this.prisma.medicalRecord.update({
        where: { id: recordId },
        data: {
          attachments: [...attachments, fileObject],
        },
      });
      
      this.logger.log(`File ${fileId} added to medical record ${recordId}`);
      
      return {
        message: 'File uploaded successfully',
        file: fileObject,
      };
    } catch (error) {
      this.logger.error(`Failed to add file to medical record: ${error.message}`);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get all files for a medical record
   */
  async getFilesForMedicalRecord(recordId: string, userId: string): Promise<MedicalRecordFile[]> {
    const record = await this.getRecordWithPermissionCheck(recordId, userId);
    
    // Use the utility function instead of duplicating logic
    return this.safelyConvertAttachments(record.attachments, recordId);
  }

  /**
   * Get details for a specific file
   */
  async getFileDetails(
    recordId: string, 
    fileId: string, 
    userId: string
  ): Promise<MedicalRecordFile & { exists: boolean, error?: string }> {
    const record = await this.getRecordWithPermissionCheck(recordId, userId);
    
    const attachments = this.safelyConvertAttachments(record.attachments, recordId);
    const file = attachments.find(f => f.id === fileId);
    
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found in this medical record`);
    }
    
    try {
      // Verify file still exists on IPFS
      const exists = await this.pinataService.fileExists(file.ipfsHash);
      
      return { 
        ...file,
        exists,
        // Refresh the gateway URL in case the system changes
        gatewayUrl: this.pinataService.getGatewayUrl(file.ipfsHash)
      };
    } catch (error) {
      this.logger.error(`Failed to verify file existence: ${error.message}`);
      return {
        ...file,
        exists: false,
        error: "Could not verify file existence"
      };
    }
  }

  /**
   * Remove a file from a medical record
   */
  async removeFileFromMedicalRecord(recordId: string, fileId: string, userId: string): Promise<{ message: string; fileId: string }> {
    // For file removal, check stricter permissions (admin or doctor who uploaded)
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { role: true }
    });
    
    // FIXED: Add null check for user
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: true,
        doctor: true,
      }
    });

    if (!record) {
      throw new NotFoundException(`Medical record with ID ${recordId} not found`);
    }
    
    // Only allow admins or the doctor who created the record to remove files
    if (user.role !== Role.ADMIN && record.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to remove files from this record');
    }
    
    // Use the utility function
    const attachments = this.safelyConvertAttachments(record.attachments, recordId);
    
    const fileIndex = attachments.findIndex(f => f.id === fileId);
    
    if (fileIndex === -1) {
      throw new NotFoundException(`File with ID ${fileId} not found in this medical record`);
    }
    
    const file = attachments[fileIndex];
    
    try {
      // Unpin from IPFS
      await this.pinataService.removeFile(file.ipfsHash);
      
      // Record the removal on blockchain
      const blockchainData = {
        action: 'medical_record_file_removed',
        recordId,
        fileId,
        fileName: file.name,
        ipfsHash: file.ipfsHash,
        timestamp: new Date().toISOString(),
        removedBy: userId
      };
      
      // Handle potential null return from blockchain service
      const blockchainTxHash = await this.blockchainService.storeDataOnChain(blockchainData) || null;
      
      // Update record - remove file from attachments
      const updatedAttachments = [...attachments];
      updatedAttachments.splice(fileIndex, 1);
      
      const updateData: any = {
        attachments: updatedAttachments,
      };
      
      // Only add blockchainTxHash if it's not null
      if (blockchainTxHash) {
        updateData.blockchainTxHash = blockchainTxHash;
      }
      
      await this.prisma.medicalRecord.update({
        where: { id: recordId },
        data: updateData,
      });
      
      this.logger.log(`File ${fileId} removed from medical record ${recordId}`);
      
      return { 
        message: 'File removed successfully',
        fileId
      };
    } catch (error) {
      this.logger.error(`Failed to remove file from medical record: ${error.message}`);
      throw new BadRequestException(`Failed to remove file: ${error.message}`);
    }
  }

  /**
   * Helper method to get record and check permissions
   */
  private async getRecordWithPermissionCheck(recordId: string, userId: string) {
    // Find the record
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: {
          include: {
            user: { select: { id: true } }
          }
        },
        doctor: {
          include: {
            user: { select: { id: true } }
          }
        },
        createdBy: true
      }
    });

    if (!record) {
      throw new NotFoundException(`Medical record with ID ${recordId} not found`);
    }

    // Check permissions (admin, doctor for this patient, creator of record, or the patient)
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        doctor: true,
        patient: true
      }
    });
    
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const isAdmin = user.role === Role.ADMIN;
    const isDoctor = user.doctor && record.doctorId === user.doctor.id;
    const isCreator = record.createdById === userId;
    const isPatient = user.patient && record.patientId === user.patient.id;

    if (!(isAdmin || isDoctor || isCreator || isPatient)) {
      throw new ForbiddenException('You do not have permission to view this record\'s files');
    }
    
    return record;
  }

  /**
   * Safely convert JSON data to MedicalRecordFile array with validation
   */
  private safelyConvertAttachments(attachments: any, recordId: string): MedicalRecordFile[] {
    if (!attachments) {
      return [];
    }
    
    // Handle if attachments is not an array
    if (!Array.isArray(attachments)) {
      this.logger.warn(`Attachments for record ${recordId} is not an array. Type: ${typeof attachments}`);
      return [];
    }
    
    try {
      // Two-step casting with validation
      const potentialAttachments = attachments as unknown as MedicalRecordFile[];
      
      // Filter out invalid entries with detailed error logging
      const validAttachments = potentialAttachments.filter(attachment => {
        if (!attachment) {
          return false;
        }
        
        const isValid = typeof attachment.id === 'string' && 
                        typeof attachment.name === 'string' &&
                        typeof attachment.ipfsHash === 'string';
        
        if (!isValid) {
          this.logger.warn(
            `Invalid attachment found in record ${recordId}. ` +
            `Missing properties. Has id: ${!!attachment.id}, ` +
            `has name: ${!!attachment.name}, has ipfsHash: ${!!attachment.ipfsHash}`
          );
        }
        
        return isValid;
      });
      
      if (validAttachments.length !== potentialAttachments.length) {
        this.logger.warn(`Found and removed ${potentialAttachments.length - validAttachments.length} invalid attachments in record ${recordId}`);
      }
      
      return validAttachments;
    } catch (error) {
      this.logger.error(`Error converting attachments for record ${recordId}: ${error.message}`);
      return [];
    }
  }
}