import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async getLeaveTypes() {
    return this.prisma.leaveType.findMany({ where: { isActive: true } });
  }

  async getMyAllocations(employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    return this.prisma.leaveAllocation.findMany({
      where: { employeeId, year: targetYear },
      include: { leaveType: true },
    });
  }

  async createRequest(data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    remarks?: string;
    attachment?: string;
  }) {
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: data.leaveTypeId },
    });

    if (!leaveType) throw new NotFoundException('Leave type not found');

    if (leaveType.requiresAttachment && !data.attachment) {
      throw new BadRequestException('Attachment is required for this leave type');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate business days
    let days = 0;
    const d = new Date(start);
    while (d <= end) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) days++;
      d.setDate(d.getDate() + 1);
    }

    // Check allocation (skip for unpaid)
    if (leaveType.name !== 'UNPAID_LEAVE') {
      const allocation = await this.prisma.leaveAllocation.findFirst({
        where: {
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          year: start.getFullYear(),
        },
      });

      if (!allocation || allocation.remaining < days) {
        throw new BadRequestException(
          `Insufficient leave balance. Available: ${allocation?.remaining || 0}, Requested: ${days}`,
        );
      }
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        days,
        remarks: data.remarks,
        attachment: data.attachment,
      },
      include: { leaveType: true },
    });
  }

  async getMyRequests(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true, approvalHistory: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRequests(status?: LeaveStatus) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, department: true },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRequest(
    requestId: string,
    actionBy: string,
    comments?: string,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true },
    });

    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update request status
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: LeaveStatus.APPROVED },
        include: { leaveType: true, employee: true },
      });

      // Create approval history
      await tx.leaveApprovalHistory.create({
        data: {
          leaveRequestId: requestId,
          action: 'APPROVED',
          actionBy,
          comments,
        },
      });

      // Deduct from allocation (skip for unpaid)
      if (request.leaveType.name !== 'UNPAID_LEAVE') {
        await tx.leaveAllocation.updateMany({
          where: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year: new Date(request.startDate).getFullYear(),
          },
          data: {
            used: { increment: request.days },
            remaining: { decrement: request.days },
          },
        });
      }

      // Create attendance records for leave days
      const d = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      while (d <= endDate) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) {
          await tx.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: request.employeeId,
                date: new Date(d),
              },
            },
            create: {
              employeeId: request.employeeId,
              date: new Date(d),
              status: 'LEAVE',
            },
            update: {
              status: 'LEAVE',
            },
          });
        }
        d.setDate(d.getDate() + 1);
      }

      return updated;
    });
  }

  async rejectRequest(
    requestId: string,
    actionBy: string,
    comments?: string,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }

    await this.prisma.leaveApprovalHistory.create({
      data: {
        leaveRequestId: requestId,
        action: 'REJECTED',
        actionBy,
        comments,
      },
    });

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: LeaveStatus.REJECTED },
      include: { leaveType: true },
    });
  }

  async getCalendarData(employeeId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: { leaveType: true },
    });

    return { attendance, leaves };
  }
}
