import { IsEnum, IsNotEmpty, IsNumber, IsString, IsDateString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ReadingType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_OXYGEN = 'BLOOD_OXYGEN',
  BLOOD_PRESSURE_SYSTOLIC = 'BLOOD_PRESSURE_SYSTOLIC',
  BLOOD_PRESSURE_DIASTOLIC = 'BLOOD_PRESSURE_DIASTOLIC',
  TEMPERATURE = 'TEMPERATURE'
}

export class HealthReadingDto {
  @ApiProperty({
    enum: ReadingType,
    description: 'Type of health reading',
    example: ReadingType.HEART_RATE,
  })
  @IsNotEmpty()
  @IsEnum(ReadingType)
  type: ReadingType;

  @ApiProperty({
    description: 'The measured value',
    example: 75,
  })
  @IsNotEmpty()
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'BPM',
  })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({
    description: 'When the reading was taken',
    example: '2025-05-15T08:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class HealthDataDto {
  @ApiProperty({ type: [HealthReadingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HealthReadingDto)
  readings: HealthReadingDto[];
}