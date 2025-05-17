import { Controller, Post, Param, UseGuards, Req, Get, Patch, UnauthorizedException, Body } from '@nestjs/common';
import { PatientDoctorsService } from './patient-doctors.service';
import { CombinedAuthGuard } from '../auth/strategies/combined-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService
import { GetUser } from '../auth/decorators/get-user.decorator'; // Import GetUser decorator
import { DoctorsService } from '../doctors/doctors.service'; // Import DoctorsService
import { PatientsService } from '../patients/patients.service'; // Import PatientsService

@Controller('patient-doctors')
@UseGuards(CombinedAuthGuard) 
export class PatientDoctorsController {
  constructor(
    private readonly patientDoctorsService: PatientDoctorsService,
    private readonly prisma: PrismaService, // Inject PrismaService
    private readonly doctorsService: DoctorsService, // Inject DoctorsService
    private readonly patientsService: PatientsService // Inject PatientsService
  ) {}

  @Post('request/doctor/:doctorId') // Changed route for clarity
  @Roles(Role.PATIENT)
  @UseGuards(RolesGuard)
  async requestDoctorAccess(@Req() req, @Param('doctorId') doctorId: string) {
    const patientUser = req.user;
    if (patientUser.role !== Role.PATIENT) {
      throw new UnauthorizedException('Only patients can request access.');
    }
    // Fetch the patient record using the userId from the token
    const patientProfile = await this.prisma.patient.findUnique({ where: { userId: patientUser.id } });
    if (!patientProfile) {
      throw new UnauthorizedException('Patient profile not found for the current user.');
    }
    return this.patientDoctorsService.requestDoctorAccess(patientProfile.id, doctorId);
  }

  @Patch('grant/patient/:patientId/doctor/:doctorId') // Changed route for clarity
  @Roles(Role.DOCTOR)
  @UseGuards(RolesGuard)
  async grantDoctorAccess(
    @Req() req,
    @Param('patientId') patientId: string,
    @Param('doctorId') doctorId: string,
  ) {
    const doctorUser = req.user;
    if (doctorUser.role !== Role.DOCTOR) {
      throw new UnauthorizedException('Only doctors can grant access.');
    }
     // Verify that the doctorId from the param matches the doctor profile of the authenticated user
    const doctorProfile = await this.prisma.doctor.findUnique({ where: { userId: doctorUser.id } });
    if (!doctorProfile || doctorProfile.id !== doctorId) {
      throw new UnauthorizedException('Doctor ID mismatch or doctor profile not found.');
    }
    return this.patientDoctorsService.grantDoctorAccess(doctorId, patientId, doctorUser.id);
  }

  @Patch('revoke/:doctorPatientId')
  @Roles(Role.PATIENT, Role.DOCTOR)
  @UseGuards(RolesGuard)
  async revokeDoctorAccess(@Req() req, @Param('doctorPatientId') doctorPatientId: string) {
    const revokingUser = req.user;
    return this.patientDoctorsService.revokeDoctorAccess(revokingUser.id, doctorPatientId, revokingUser.id, revokingUser.role as Role);
  }

  @Get('patient/my-connections') // Changed route for clarity
  @Roles(Role.PATIENT)
  @UseGuards(RolesGuard)
  async getConnectionsForPatient(@Req() req) {
    const patientUser = req.user;
    if (patientUser.role !== Role.PATIENT) {
      throw new UnauthorizedException('User is not a patient.');
    }
    return this.patientDoctorsService.getConnectionsForPatient(patientUser.id);
  }

  @Get('doctor/my-connections') // Changed route for clarity
  @Roles(Role.DOCTOR)
  @UseGuards(RolesGuard)
  async getConnectionsForDoctor(@Req() req) {
    const doctorUser = req.user;
    if (doctorUser.role !== Role.DOCTOR) {
      throw new UnauthorizedException('User is not a doctor.');
    }
    return this.patientDoctorsService.getConnectionsForDoctor(doctorUser.id);
  }

  @Post('request-by-wallet')
  @Roles(Role.DOCTOR)
  async requestAccessByWallet(
    @Body() dto: { patientWalletAddress: string }, 
    @GetUser() user
  ) {
    const doctor = await this.doctorsService.findByUserId(user.id);
    return this.patientDoctorsService.requestAccessByWallet(doctor.id, dto.patientWalletAddress);
  }

  @Post('verify-approve')
  @Roles(Role.PATIENT)
  async verifyAndApproveConnection(
    @Body() dto: { connectionId: string, signature: string },
    @GetUser() user
  ) {
    const patient = await this.patientsService.findByUserId(user.id);
    return this.patientDoctorsService.verifyAndApproveConnection(
      dto.connectionId, 
      dto.signature, 
      patient.id
    );
  }
}