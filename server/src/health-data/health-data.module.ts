import { Module } from '@nestjs/common';
import { HealthDataService } from './health-data.service';
import { HealthDataController } from './health-data.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PatientDoctorsModule } from '../patient-doctors/patient-doctors.module';
import { BlockchainModule } from '../blockchain/blockchain.module'; // Add this import

@Module({
  imports: [
    PrismaModule, 
    PatientDoctorsModule,
    BlockchainModule, // Add this import
  ],
  controllers: [HealthDataController],
  providers: [HealthDataService],
  exports: [HealthDataService],
})
export class HealthDataModule {}