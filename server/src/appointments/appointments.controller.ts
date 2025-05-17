import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 409, description: 'Scheduling conflict' })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @GetUser() user) {
    return this.appointmentsService.create(createAppointmentDto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({ status: 200, description: 'Return all appointments' })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('patient/:patientId')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get appointments for a patient' })
  @ApiResponse({ status: 200, description: 'Return appointments for a patient' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.findByPatientId(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Get appointments for a doctor' })
  @ApiResponse({ status: 200, description: 'Return appointments for a doctor' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findByDoctorId(doctorId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Return appointment by ID' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Scheduling conflict' })
  update(
    @Param('id') id: string, 
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @GetUser() user
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(@Param('id') id: string, @GetUser() user) {
    return this.appointmentsService.remove(id, user.id);
  }
}