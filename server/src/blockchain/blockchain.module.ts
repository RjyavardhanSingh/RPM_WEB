import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule, // Add this line
  ],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}