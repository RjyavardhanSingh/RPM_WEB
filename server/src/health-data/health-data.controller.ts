import { 
  Controller, Get, Post, Body, Param, Query, 
  UseGuards, Req, ParseIntPipe, DefaultValuePipe, ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../auth/strategies/combined-auth.guard';
import { User as UserDecorator } from '../auth/decorators/user.decorator';
import { User, Role } from '@prisma/client';
import { HealthDataService } from './health-data.service';
import { CreateHealthReadingDto, CreateBatchHealthReadingsDto, ReadingType, HealthDataDto } from './dto/create-health-reading.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health-data')
@Controller('health-data')
@UseGuards(CombinedAuthGuard)
export class HealthDataController {
  constructor(
    private readonly healthDataService: HealthDataService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a health reading (for patients)' })
  @ApiResponse({ status: 201, description: 'Health reading saved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only patients can submit readings' })
  async createReading(
    @UserDecorator() user: User,
    @Body() dto: CreateHealthReadingDto
  ) {
    return this.healthDataService.createReading(user.id, dto);
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit multiple health readings at once (for patients)' })
  @ApiResponse({ status: 201, description: 'Health readings saved successfully' })
  async createBatchReadings(
    @UserDecorator() user: User,
    @Body() dto: CreateBatchHealthReadingsDto
  ) {
    return this.healthDataService.createBatchReadings(user.id, dto.readings);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my health readings (for patients and doctors)' })
  @ApiResponse({ status: 200, description: 'Health readings retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'type', required: false, enum: ReadingType, description: 'Filter by reading type' })
  async getMyReadings(
    @UserDecorator() user: User,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('type') type?: ReadingType
  ) {
    return this.healthDataService.getMyReadings(user.id, limit, page, type);
  }

  @Get('patients')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of patients (for doctors)' })
  @ApiResponse({ status: 200, description: 'Patient list retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only doctors can access this' })
  async getMyPatients(@UserDecorator() user: User) {
    return this.healthDataService.getMyPatients(user.id);
  }

  @Get('patients/:patientId')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a patient's health readings (for doctors)" })
  @ApiResponse({ status: 200, description: 'Health readings retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only doctors can access this or no active connection' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'type', required: false, enum: ReadingType, description: 'Filter by reading type' })
  async getPatientReadings(
    @UserDecorator() user: User, // This is the authenticated doctor
    @Param('patientId') targetPatientUserId: string, // This is the User ID of the target patient
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('type') type?: ReadingType,
  ) {
    if (user.role !== Role.DOCTOR) {
      throw new ForbiddenException('Only doctors can perform this action.');
    }
    // The user.id is the requestingDoctorUserId
    // The patientId from param is the targetPatientUserId
    // The HealthDataService.getPatientReadings now expects these two distinct IDs.

    // Note: The old code had blockchain logging and other service calls here.
    // For now, focusing on the core logic of calling the updated service method.
    // Blockchain logging and other cross-cutting concerns can be re-added or handled by aspects/interceptors.
    return this.healthDataService.getPatientReadings(user.id, targetPatientUserId, limit, page, type);
  }

  @Post('sample-data')
  @ApiOperation({ summary: 'Create sample health readings for testing' })
  @ApiResponse({ status: 201, description: 'Sample data created successfully' })
  async createSampleData(@UserDecorator() user: User) {
    const readingTypes = Object.values(ReadingType);
    const sampleReadings = readingTypes.map(type => ({
      patientId: user.id, // Add patientId here
      type,
      value: type === ReadingType.HEART_RATE ? 75 : 
             type === ReadingType.BLOOD_OXYGEN ? 98 :
             type === ReadingType.BLOOD_PRESSURE_SYSTOLIC ? 120 :
             type === ReadingType.BLOOD_PRESSURE_DIASTOLIC ? 80 :
             type === ReadingType.TEMPERATURE ? 37.2 : 0,
      unit: type === ReadingType.HEART_RATE ? 'BPM' :
            type === ReadingType.BLOOD_OXYGEN ? '%' :
            type === ReadingType.BLOOD_PRESSURE_SYSTOLIC ? 'mmHg' :
            type === ReadingType.BLOOD_PRESSURE_DIASTOLIC ? 'mmHg' :
            type === ReadingType.TEMPERATURE ? '°C' : 'unknown',
      timestamp: new Date().toISOString()
    }));

    await this.healthDataService.createBatchReadings(user.id, sampleReadings); 
    return { message: 'Sample data created successfully', count: sampleReadings.length };
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get sample health data (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Health readings retrieved successfully' })
  async getPublicData() {
    console.log('PUBLIC ENDPOINT CALLED - FETCHING REAL DATA');
    
    try {
      const readings = await this.prisma.healthReading.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
      });
      
      console.log(`Found ${readings.length} real readings in the database`);
      
      return {
        data: readings,
        meta: {
          total: readings.length,
          page: 1,
          limit: 100,
          pages: 1,
        }
      };
    } catch (error) {
      console.error('Error fetching real data:', error);
      
      const now = new Date().toISOString();
      const sampleData = [
        {
          id: 'sample-1',
          patientId: 'demo-patient',
          type: ReadingType.HEART_RATE,
          value: 75,
          unit: 'BPM',
          timestamp: now,
          createdAt: now,
          updatedAt: now,
        },
      ];
      
      return {
        data: sampleData,
        meta: {
          total: sampleData.length,
          page: 1,
          limit: 100,
          pages: 1,
        }
      };
    }
  }
}

@ApiTags('health-data')
@Controller('patient')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class PatientHealthDataController {
  constructor(private readonly healthDataService: HealthDataService) {}

  @Post('health-data')
  @ApiOperation({ summary: 'Submit health readings from mobile app' })
  @ApiResponse({ status: 201, description: 'Health readings saved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitHealthData(
    @UserDecorator() user: User,
    @Body() data: HealthDataDto
  ) {
    await this.healthDataService.storeHealthReadings(user.id, data.readings);
    return { message: 'Health data received successfully' };
  }

  @Get('health-data')
  @ApiOperation({ summary: 'Get my health readings' })
  @ApiResponse({ status: 200, description: 'Health readings retrieved successfully' })
  async getMyHealthData(@UserDecorator() user: User) {
    const readings = await this.healthDataService.getMyReadings(user.id, 100, 1);
    console.log(`Found ${readings.data.length} readings for user ${user.id}`);
    return readings;
  }

  @Get('health-data/:patientId')
  @ApiOperation({ summary: "Get a specific patient's health readings (doctor only)" })
  @ApiResponse({ status: 200, description: 'Health readings retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only doctors can access this or no active connection' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'type', required: false, enum: ReadingType, description: 'Filter by reading type' })
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  async getPatientHealthData(
    @UserDecorator() user: User, // This is the authenticated doctor
    @Param('patientId') targetPatientUserId: string, // This is the User ID of the target patient
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('type') type?: ReadingType
  ) {
    if (user.role !== Role.DOCTOR) {
      throw new ForbiddenException('Only doctors can perform this action.');
    }
    return this.healthDataService.getPatientReadings(user.id, targetPatientUserId, limit, page, type);
  }

  @Get('latest-vitals/:patientUserId')
  @ApiOperation({ summary: 'Get latest vital signs for a specific patient (doctors) or self (patients)' })
  @ApiResponse({ status: 200, description: 'Latest vital signs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
  async getLatestVitals(
    @UserDecorator() user: User, 
    @Param('patientUserId') patientUserId?: string
  ) {
    if (user.role === Role.DOCTOR) {
      if (!patientUserId) {
        throw new ForbiddenException('Patient ID is required for doctors to fetch vitals.');
      }
      return this.healthDataService.getLatestVitals(patientUserId);
    } else if (user.role === Role.PATIENT || user.role === Role.USER) {
      if (patientUserId && patientUserId !== user.id) {
        throw new ForbiddenException('Patients can only fetch their own vitals.');
      }
      return this.healthDataService.getLatestVitals(user.id);
    } else {
      throw new ForbiddenException('User role not authorized.');
    }
  }
}