// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { VitalSignsModule } from './vital-signs/vital-signs.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { PinataModule } from './pinata/pinata.module';
import { HealthDataModule } from './health-data/health-data.module';
import { PatientDoctorsModule } from './patient-doctors/patient-doctors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    PatientsModule,
    DoctorsModule,
    MedicalRecordsModule,
    VitalSignsModule,
    AppointmentsModule,
    NotificationsModule,
    BlockchainModule,
    PinataModule,
    HealthDataModule,
    PatientDoctorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}