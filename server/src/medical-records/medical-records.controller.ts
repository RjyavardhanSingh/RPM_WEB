import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Param, 
  UseGuards, 
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  MaxFileSizeValidator,
  ParseFilePipe,
  Body,
  Patch
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { MedicalRecordsFilesService } from './medical-records-files.service';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@ApiTags('medical-records-files')
@ApiBearerAuth()
@Controller('medical-records/:recordId/files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordsFilesController {
  constructor(private readonly filesService: MedicalRecordsFilesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file attachment to a medical record' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or medical record' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)'
        }
      }
    }
  })
  async uploadFile(
    @Param('recordId') recordId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB limit
        ],
      }),
    ) 
    file: Express.Multer.File,
    @GetUser() user
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    return this.filesService.addFileToMedicalRecord(recordId, file, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get all files attached to a medical record' })
  @ApiResponse({ status: 200, description: 'List of files' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  async getFiles(
    @Param('recordId') recordId: string,
    @GetUser() user
  ) {
    return this.filesService.getFilesForMedicalRecord(recordId, user.id);
  }

  @Get(':fileId')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get file details' })
  @ApiResponse({ status: 200, description: 'File details' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(
    @Param('recordId') recordId: string,
    @Param('fileId') fileId: string,
    @GetUser() user
  ) {
    return this.filesService.getFileDetails(recordId, fileId, user.id);
  }

  @Delete(':fileId')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Delete a file from a medical record' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('recordId') recordId: string,
    @Param('fileId') fileId: string,
    @GetUser() user
  ) {
    return this.filesService.removeFileFromMedicalRecord(recordId, fileId, user.id);
  }
}

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Create a new medical record' })
  @ApiResponse({ status: 201, description: 'Medical record created successfully' })
  create(@Body() createMedicalRecordDto: CreateMedicalRecordDto, @GetUser() user) {
    return this.medicalRecordsService.create(createMedicalRecordDto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Get all medical records' })
  @ApiResponse({ status: 200, description: 'Return all medical records' })
  findAll() {
    return this.medicalRecordsService.findAll();
  }

  @Get('patient/:patientId')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get medical records for a patient' })
  @ApiResponse({ status: 200, description: 'Return medical records for patient' })
  findByPatientId(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.findByPatientId(patientId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get medical record by ID' })
  @ApiResponse({ status: 200, description: 'Return medical record by ID' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Update medical record by ID' })
  @ApiResponse({ status: 200, description: 'Medical record updated successfully' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  update(@Param('id') id: string, @Body() updateMedicalRecordDto: UpdateMedicalRecordDto, @GetUser() user) {
    return this.medicalRecordsService.update(id, updateMedicalRecordDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete medical record by ID' })
  @ApiResponse({ status: 200, description: 'Medical record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  remove(@Param('id') id: string, @GetUser() user) {
    return this.medicalRecordsService.remove(id, user.id);
  }

  @Get(':id/verify')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Verify medical record data on blockchain' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  verifyIntegrity(@Param('id') id: string) {
    return this.medicalRecordsService.verifyIntegrity(id);
  }
}