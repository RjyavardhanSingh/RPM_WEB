import { Module } from '@nestjs/common';
import { PatientDoctorsController } from './patient-doctors.controller';
import { PatientDoctorsService } from './patient-doctors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BlockchainModule,
    DoctorsModule,
    PatientsModule,
  ],
  controllers: [PatientDoctorsController],
  providers: [PatientDoctorsService],
  exports: [PatientDoctorsService]
})
export class PatientDoctorsModule {}
