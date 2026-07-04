import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing?.checkIn) {
      throw new BadRequestException('Already checked in today');
    }

    const now = new Date();
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { workSchedule: true },
    });

    let status: AttendanceStatus = AttendanceStatus.PRESENT;

    // Check if late based on work schedule
    if (employee?.workSchedule) {
      const [schedH, schedM] = employee.workSchedule.startTime.split(':').map(Number);
      const scheduleStart = new Date(today);
      scheduleStart.setHours(schedH, schedM + 15, 0, 0); // 15 min grace
      if (now > scheduleStart) {
        status = AttendanceStatus.LATE;
      }
    }

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkIn: now, status },
      });
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: now,
        status,
      },
    });
  }

  async checkOut(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance?.checkIn) {
      throw new BadRequestException('Must check in first');
    }

    if (attendance.checkOut) {
      throw new BadRequestException('Already checked out today');
    }

    const now = new Date();
    const checkInTime = new Date(attendance.checkIn);
    const diffMs = now.getTime() - checkInTime.getTime();
    const breakMs = attendance.breakMinutes * 60 * 1000;
    const workMs = diffMs - breakMs;
    const workHours = Math.round((workMs / (1000 * 60 * 60)) * 100) / 100;

    // Calculate extra hours (beyond 8 hours)
    const extraHours = Math.max(0, Math.round((workHours - 8) * 100) / 100);

    // Determine status
    let status = attendance.status;
    if (workHours < 4) {
      status = AttendanceStatus.HALF_DAY;
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        workHours,
        extraHours,
        status,
      },
    });
  }

  async getMyAttendance(employeeId: string, month?: number, year?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate summary
    const presentDays = records.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE',
    ).length;
    const leaveDays = records.filter((r) => r.status === 'LEAVE').length;
    const halfDays = records.filter((r) => r.status === 'HALF_DAY').length;

    // Total working days in month (excluding weekends)
    let totalWorkingDays = 0;
    const d = new Date(startDate);
    while (d <= endDate && d <= now) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) totalWorkingDays++;
      d.setDate(d.getDate() + 1);
    }

    return {
      records,
      summary: {
        presentDays,
        leaveDays,
        halfDays,
        totalWorkingDays,
      },
    };
  }

  async getAllAttendance(filters: {
    employeeId?: string;
    date?: string;
    month?: number;
    year?: number;
    departmentId?: string;
  }) {
    const where: any = {};

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.date) {
      const d = new Date(filters.date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    } else if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      where.date = { gte: startDate, lte: endDate };
    }

    if (filters.departmentId) {
      where.employee = { departmentId: filters.departmentId };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getTodayStatus(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    return {
      checkedIn: !!attendance?.checkIn,
      checkedOut: !!attendance?.checkOut,
      checkInTime: attendance?.checkIn,
      checkOutTime: attendance?.checkOut,
      workHours: attendance?.workHours || 0,
      status: attendance?.status || 'ABSENT',
    };
  }
}
