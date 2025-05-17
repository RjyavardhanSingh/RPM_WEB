import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Create multiple notifications' })
  @ApiResponse({ status: 201, description: 'Notifications created successfully' })
  createBulk(@Body() createNotificationsDto: CreateNotificationDto[]) {
    return this.notificationsService.createBulk(createNotificationsDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Return all notifications' })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'Return all notifications for the current user' })
  findMyNotifications(@GetUser() user) {
    return this.notificationsService.findByUserId(user.id);
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({ status: 200, description: 'Return unread notification count' })
  getMyUnreadCount(@GetUser() user) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Get notifications for a specific user' })
  @ApiResponse({ status: 200, description: 'Return all notifications for a user' })
  findByUserId(@Param('userId') userId: string) {
    return this.notificationsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Return notification by ID' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read/unread' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(
    @Param('id') id: string, 
    @Body() markReadDto: MarkReadDto,
    @GetUser() user
  ) {
    return this.notificationsService.markAsRead(id, markReadDto.isRead, user.id);
  }

  @Post('me/mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  markAllAsRead(@GetUser() user) {
    return this.notificationsService.markAllAsRead(user.id).then(count => ({
      message: `${count} notifications marked as read`,
      count
    }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@Param('id') id: string, @GetUser() user) {
    return this.notificationsService.remove(id, user.id);
  }

  @Delete('me/all')
  @ApiOperation({ summary: 'Delete all notifications for current user' })
  @ApiResponse({ status: 200, description: 'Notifications deleted successfully' })
  removeAll(@GetUser() user) {
    return this.notificationsService.removeAll(user.id).then(count => ({
      message: `${count} notifications deleted`,
      count
    }));
  }
}