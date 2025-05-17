import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PinataService } from './pinata.service';

@Module({
  imports: [ConfigModule],
  providers: [PinataService],
  exports: [PinataService],
})
export class PinataModule {}