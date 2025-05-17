import { Controller, Get, Post, Body, Patch, Param, UseGuards, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PatientsService } from 'src/patients/patients.service';


@ApiTags('vital-signs')
@ApiBearerAuth()
@Controller('vital-signs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VitalSignsController {
  constructor(
    private readonly vitalSignsService: VitalSignsService,
    private readonly patientsService: PatientsService  
  ) {}

  @Post()
  @Roles(Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Create a new vital sign record' })
  @ApiResponse({ status: 201, description: 'Vital sign record created successfully' })
  create(@Body() createVitalSignDto: CreateVitalSignDto, @GetUser() user) {
    // If user is a patient, ensure they can only add vital signs for themselves
    if (user.role === Role.PATIENT) {
      return this.patientsService.findByUserId(user.id).then(patient => {
        if (createVitalSignDto.patientId !== patient.id) {
          throw new ForbiddenException('You can only add vital signs for yourself');
        }
        // Update DTO to include userId since our Prisma schema requires it
        const dtoWithUserId = { ...createVitalSignDto, userId: user.id };
        return this.vitalSignsService.create(dtoWithUserId);
      });
    }
    
    // For doctors, just add the userId
    const dtoWithUserId = { ...createVitalSignDto, userId: user.id };
    return this.vitalSignsService.create(dtoWithUserId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Get all vital sign records' })
  @ApiResponse({ status: 200, description: 'Return all vital sign records' })
  findAll() {
    return this.vitalSignsService.findAll();
  }

  @Get('patient/:patientId')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get vital signs by patient ID' })
  @ApiResponse({ status: 200, description: 'Return vital signs for patient' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findByPatientId(@Param('patientId') patientId: string, @GetUser() user) {
    // If user is a patient, they can only view their own vital signs
    if (user.role === Role.PATIENT) {
      // Find the patient record for this user
      return this.patientsService.findByUserId(user.id).then(patient => {
        if (patient.id !== patientId) {
          throw new UnauthorizedException('You can only view your own vital signs');
        }
        return this.vitalSignsService.findByPatientId(patientId);
      });
    }
    
    return this.vitalSignsService.findByPatientId(patientId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get vital sign by ID' })
  @ApiResponse({ status: 200, description: 'Return vital sign by ID' })
  @ApiResponse({ status: 404, description: 'Vital sign not found' })
  findOne(@Param('id') id: string) {
    return this.vitalSignsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Update vital sign by ID' })
  @ApiResponse({ status: 200, description: 'Vital sign updated successfully' })
  @ApiResponse({ status: 404, description: 'Vital sign not found' })
  update(@Param('id') id: string, @Body() updateVitalSignDto: UpdateVitalSignDto) {
    return this.vitalSignsService.update(id, updateVitalSignDto);
  }

  @Get(':id/verify')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Verify vital sign data on blockchain' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  @ApiResponse({ status: 404, description: 'Vital sign not found' })
  verifyBlockchainRecord(@Param('id') id: string) {
    return this.vitalSignsService.verifyBlockchainRecord(id);
  }
}