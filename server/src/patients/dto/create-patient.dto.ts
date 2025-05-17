import { IsString, IsOptional, IsEnum, IsEmail, MinLength, IsDate, IsBoolean, IsMobilePhone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreatePatientDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Date of birth' })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({ enum: Gender, description: 'Patient gender' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Phone number' })
  @IsMobilePhone()
  phoneNumber: string;

  @ApiProperty({ enum: BloodType, required: false })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasInsurance?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insuranceDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;
}