import { IsString, IsOptional, IsUUID, IsEnum, IsDate, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Doctor ID' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ description: 'Scheduled date and time' })
  @Type(() => Date)
  @IsDate()
  scheduledAt: Date;

  @ApiProperty({ description: 'End date and time' })
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @ApiProperty({ enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  meetingLink?: string;
}