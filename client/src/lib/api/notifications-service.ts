import { BaseApi } from './base-api';

export interface Notification {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'VITAL_ALERT' | 'MEDICAL_RECORD' | 'GENERAL';
  isRead: boolean;
  actionUrl?: string;
  relatedId?: string;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'VITAL_ALERT' | 'MEDICAL_RECORD' | 'GENERAL';
  actionUrl?: string;
  relatedId?: string;
}

export class NotificationsService extends BaseApi {
  async getNotifications(): Promise<Notification[]> {
    const response = await this.get<Notification[]>('/notifications');
    return response.data;
  }

  async getNotificationById(id: string): Promise<Notification> {
    const response = await this.get<Notification>(`/notifications/${id}`);
    return response.data;
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await this.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await this.patch<Notification>(`/notifications/${id}/read`, {});
    return response.data;
  }

  async markAllAsRead(): Promise<void> {
    await this.post('/notifications/mark-all-read');
  }

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    const response = await this.post<Notification>('/notifications', data);
    return response.data;
  }

  async deleteNotification(id: string): Promise<void> {
    await this.delete(`/notifications/${id}`);
  }
}

export const notificationsService = new NotificationsService();