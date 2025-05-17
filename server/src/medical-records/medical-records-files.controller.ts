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
  ParseFilePipe,
  MaxFileSizeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { MedicalRecordsFilesService } from './medical-records-files.service';
import { MedicalRecordFile } from './interfaces/medical-record-file.interface';

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