import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment, AppointmentStatus, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, userId: string): Promise<Appointment> {
    const { patientId, doctorId, scheduledAt, endTime } = createAppointmentDto;

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Check for time conflicts with doctor's existing appointments
    const conflictingDoctorAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        OR: [
          {
            // New appointment starts during an existing appointment
            scheduledAt: { lte: scheduledAt },
            endTime: { gt: scheduledAt },
          },
          {
            // New appointment ends during an existing appointment
            scheduledAt: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            // New appointment encompasses an existing appointment
            scheduledAt: { gte: scheduledAt },
            endTime: { lte: endTime },
          },
        ],
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
    });

    if (conflictingDoctorAppointment) {
      throw new ConflictException('Doctor has a conflicting appointment at this time');
    }

    // Create new appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
        scheduledTime: createAppointmentDto.scheduledAt, // Map the field correctly
        userId,
      },
      include: {
        doctor: {
          include: {
            user: true
          }
        },
        patient: {
          include: {
            user: true
          }
        }
      }
    });

    // Send notifications
    try {
      // Notify patient
      if (appointment.patient?.user?.id) {
        await this.notificationsService.createAppointmentReminder(
          appointment.patient.user.id,
          appointment.id,
          appointment.doctor.user.name || 'your doctor',
          appointment.scheduledAt
        );
      }

      // Notify doctor
      if (appointment.doctor?.user?.id) {
        await this.notificationsService.create({
          userId: appointment.doctor.user.id,
          type: 'APPOINTMENT',
          title: 'New Appointment Scheduled',
          message: `A new appointment with ${appointment.patient.user.name || 'a patient'} has been scheduled for ${appointment.scheduledAt.toLocaleString()}.`,
          relatedId: appointment.id,
          actionUrl: `/appointments/${appointment.id}`
        });
      }
    } catch (error) {
      console.error('Failed to send appointment notifications:', error);
      // Don't fail the appointment creation if notifications fail
    }

    return appointment;
  }

  // Make sure appointments retrieval includes the right relations
  async findAll(): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    return this.prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, userId: string): Promise<Appointment> {
    // Check if appointment exists
    const appointment = await this.findOne(id);
    
    // Get user role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    // Only allow doctor, patient involved in appointment, or admin to update
    const canUpdate = 
      user?.role === Role.ADMIN || 
      appointment.doctorId === userId || 
      appointment.patientId === userId;
    
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this appointment');
    }
    
    // Check for scheduling conflicts if changing time
    if (updateAppointmentDto.scheduledAt || updateAppointmentDto.endTime) {
      const scheduledAt = updateAppointmentDto.scheduledAt || appointment.scheduledAt;
      const endTime = updateAppointmentDto.endTime || appointment.endTime;
      
      const conflictingAppointment = await this.prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          id: { not: id },
          OR: [
            {
              scheduledAt: { lte: scheduledAt },
              endTime: { gt: scheduledAt },
            },
            {
              scheduledAt: { lt: endTime },
              endTime: { gte: endTime },
            },
            {
              scheduledAt: { gte: scheduledAt },
              endTime: { lte: endTime },
            },
          ],
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        },
      });
      
      if (conflictingAppointment) {
        throw new ConflictException('This time conflicts with another appointment');
      }
    }
    
    // Update record
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...updateAppointmentDto,
        scheduledTime: updateAppointmentDto.scheduledAt, // Map the field correctly
      },
      include: {
        doctor: {
          include: {
            user: true
          }
        },
        patient: {
          include: {
            user: true
          }
        }
      }
    });
    
    // Send notifications for appointment updates
    try {
      if (updatedAppointment.status === AppointmentStatus.CONFIRMED) {
        // Notify patient about confirmation
        if (updatedAppointment.patient?.user?.id) {
          await this.notificationsService.create({
            userId: updatedAppointment.patient.user.id,
            type: 'APPOINTMENT',
            title: 'Appointment Confirmed',
            message: `Your appointment with Dr. ${updatedAppointment.doctor.user.name || 'your doctor'} on ${updatedAppointment.scheduledAt.toLocaleString()} has been confirmed.`,
            relatedId: updatedAppointment.id,
            actionUrl: `/appointments/${updatedAppointment.id}`
          });
        }
      } else if (updatedAppointment.status === AppointmentStatus.CANCELLED) {
        // Notify both parties about cancellation
        const cancelledMessage = `Appointment scheduled for ${updatedAppointment.scheduledAt.toLocaleString()} has been cancelled.`;
        
        if (updatedAppointment.patient?.user?.id) {
          await this.notificationsService.create({
            userId: updatedAppointment.patient.user.id,
            type: 'APPOINTMENT',
            title: 'Appointment Cancelled',
            message: cancelledMessage,
            relatedId: updatedAppointment.id,
            actionUrl: `/appointments`
          });
        }
        
        if (updatedAppointment.doctor?.user?.id) {
          await this.notificationsService.create({
            userId: updatedAppointment.doctor.user.id,
            type: 'APPOINTMENT',
            title: 'Appointment Cancelled',
            message: cancelledMessage,
            relatedId: updatedAppointment.id,
            actionUrl: `/appointments`
          });
        }
      }
    } catch (error) {
      console.error('Failed to send appointment update notifications:', error);
      // Don't fail the appointment update if notifications fail
    }
    
    return updatedAppointment;
  }

  async remove(id: string, userId: string): Promise<Appointment> {
    // Check if appointment exists
    const appointment = await this.findOne(id);
    
    // Get user role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    // Only allow admins or the doctor to cancel/delete appointments
    const canDelete = 
      user?.role === Role.ADMIN || 
      (user?.role === Role.DOCTOR && appointment.doctorId === userId);
    
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this appointment');
    }

    return this.prisma.appointment.delete({
      where: { id },
    });
  }
}