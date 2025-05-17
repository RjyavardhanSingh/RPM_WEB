import { Module } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsFilesController } from './medical-records-files.controller';
import { MedicalRecordsFilesService } from './medical-records-files.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { PinataModule } from '../pinata/pinata.module';
import { NotificationsModule } from '../notifications/notifications.module'; // Add this import

@Module({
  imports: [
    PrismaModule, 
    BlockchainModule, 
    PinataModule,
    NotificationsModule 
  ],
  controllers: [
    MedicalRecordsController,
    MedicalRecordsFilesController
  ],
  providers: [
    MedicalRecordsService,
    MedicalRecordsFilesService
  ],
  exports: [
    MedicalRecordsService,
    MedicalRecordsFilesService
  ],
})
export class MedicalRecordsModule {}
