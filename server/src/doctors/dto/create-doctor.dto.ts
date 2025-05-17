import { IsString, IsOptional, IsArray, IsEnum, MinLength, IsDate, IsBoolean, IsMobilePhone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum Specialization {
  CARDIOLOGY = 'CARDIOLOGY',
  DERMATOLOGY = 'DERMATOLOGY',
  ENDOCRINOLOGY = 'ENDOCRINOLOGY',
  GASTROENTEROLOGY = 'GASTROENTEROLOGY',
  GENERAL_PRACTICE = 'GENERAL_PRACTICE',
  NEUROLOGY = 'NEUROLOGY',
  ONCOLOGY = 'ONCOLOGY',
  PEDIATRICS = 'PEDIATRICS',
  PSYCHIATRY = 'PSYCHIATRY',
  SURGERY = 'SURGERY',
  OTHER = 'OTHER',
}

export class CreateDoctorDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: Specialization })
  @IsEnum(Specialization)
  specialization: Specialization;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  licenseNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hospital?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  certifications?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({ description: 'Phone number' })
  @IsMobilePhone()
  phoneNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}