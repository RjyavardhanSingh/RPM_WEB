import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationType, Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: createNotificationDto.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${createNotificationDto.userId} not found`);
      }

      return this.prisma.notification.create({
        data: {
          ...createNotificationDto,
          isRead: createNotificationDto.isRead ?? false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  async createBulk(notifications: CreateNotificationDto[]): Promise<number> {
    if (!notifications.length) return 0;
    
    // Verify all users exist
    const userIds = [...new Set(notifications.map(n => n.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    
    const foundUserIds = users.map(u => u.id);
    const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
    
    if (missingUserIds.length) {
      throw new NotFoundException(`Users with IDs ${missingUserIds.join(', ')} not found`);
    }

    // Create all notifications
    const result = await this.prisma.notification.createMany({
      data: notifications.map(n => ({
        ...n,
        isRead: false,
      })),
    });

    return result.count;
  }

  async findAll(): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.notification.count({
      where: { 
        userId,
        isRead: false 
      },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAsRead(id: string, isRead: boolean, userId?: string): Promise<Notification> {
    const notification = await this.findOne(id);
    
    // Only the notification recipient or admin can mark it as read/unread
    if (userId && notification.userId !== userId) {
      // Check if user is an admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      
      if (!user || user.role !== Role.ADMIN) {
        throw new ForbiddenException('You can only mark your own notifications as read');
      }
    }
    
    return this.prisma.notification.update({
      where: { id },
      data: { isRead },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const result = await this.prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false 
      },
      data: { isRead: true },
    });

    return result.count;
  }

  async remove(id: string, userId?: string): Promise<Notification> {
    const notification = await this.findOne(id);
    
    // Only the notification recipient or admin can delete it
    if (userId && notification.userId !== userId) {
      // Check if user is an admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      
      if (!user || user.role !== Role.ADMIN) {
        throw new ForbiddenException('You can only delete your own notifications');
      }
    }
    
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async removeAll(userId: string): Promise<number> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  // Helper methods for creating specific types of notifications

  async createAppointmentReminder(
    userId: string,
    appointmentId: string,
    doctorName: string,
    appointmentDate: Date
  ): Promise<Notification> {
    const formattedDate = appointmentDate.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    return this.create({
      userId,
      type: NotificationType.APPOINTMENT, // Changed from APPOINTMENT_REMINDER
      title: 'Upcoming Appointment Reminder',
      message: `You have an appointment with Dr. ${doctorName} on ${formattedDate}.`,
      relatedId: appointmentId,
      actionUrl: `/appointments/${appointmentId}`,
      isRead: false
    });
  }

  /**
   * Create a notification for abnormal vital signs
   * @param userId ID of the doctor to notify
   * @param patientName Name of the patient with abnormal readings
   * @param vitalSignId ID of the vital sign record
   * @param metric Name of the abnormal metric (e.g., "heart rate", "blood pressure")
   * @param value The abnormal value recorded
   */
  async createVitalSignAlert(
    userId: string,
    patientName: string,
    vitalSignId: string,
    metric: string,
    value: number
  ): Promise<Notification> {
    return this.create({
      userId,
      type: 'VITAL_ALERT',
      title: 'Abnormal Vital Sign Alert',
      message: `Patient ${patientName} has recorded an abnormal ${metric} reading of ${value}.`,
      relatedId: vitalSignId,
      actionUrl: `/vital-signs/patient/${vitalSignId}`,
    });
  }

  async createMedicalRecordUpdate(
    userId: string,
    patientName: string,
    recordId: string
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.SYSTEM, // Changed from MEDICAL_RECORD_UPDATE
      title: 'Medical Record Updated',
      message: `A medical record for ${patientName} has been updated.`,
      relatedId: recordId,
      actionUrl: `/medical-records/${recordId}`,
      isRead: false
    });
  }
}