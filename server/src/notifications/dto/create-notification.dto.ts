import { IsString, IsUUID, IsEnum, IsOptional, IsBoolean, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to send notification to' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ required: false, description: 'ID of related record (appointment, vital sign, etc.)' })
  @IsOptional()
  @IsString()
  relatedId?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({ required: false, description: 'Action URL if notification requires user action' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiProperty({ required: false, description: 'Link to associated resource' })
  @IsOptional()
  @IsString()
  link?: string;
}