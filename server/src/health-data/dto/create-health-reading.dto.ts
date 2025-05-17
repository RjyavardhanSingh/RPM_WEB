import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReadingType as PrismaReadingType } from '@prisma/client';

// Use Prisma's ReadingType instead of duplicating the enum
export { PrismaReadingType as ReadingType };

export class CreateHealthReadingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ enum: PrismaReadingType })
  @IsEnum(PrismaReadingType)
  @IsNotEmpty()
  type: PrismaReadingType;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

// For batch submission
export class CreateBatchHealthReadingsDto {
  @ApiProperty({ type: [CreateHealthReadingDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHealthReadingDto)
  readings: CreateHealthReadingDto[];
}

// For mobile app (using the same DTO structure)
export class HealthDataDto {
  @ApiProperty({ type: [CreateHealthReadingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHealthReadingDto)
  readings: CreateHealthReadingDto[];
}