import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVitalSignDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(220)
  heartRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(250)
  bloodPressureSystolic?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(140)
  bloodPressureDiastolic?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(35)
  @Max(42)
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(40)
  respiratoryRate?: number;

  @ApiProperty({ required: false, description: 'Oxygen saturation level (%)' })
  @IsOptional()
  @IsNumber()
  @Min(70)
  @Max(100)
  oxygenSaturation?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(400)
  glucoseLevel?: number;
}