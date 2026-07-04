import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { generateLoginId } from '../common/id-generator.util';
import { generatePassword } from '../common/password-generator.util';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    designationId?: string;
    managerId?: string;
    joiningDate: string;
    role?: Role;
    profilePicture?: string;
  }) {
    const joiningDate = new Date(data.joiningDate);
    const joiningYear = joiningDate.getFullYear();

    // Get next sequence for this year
    const maxSeq = await this.prisma.employee.aggregate({
      _max: { employeeSequence: true },
      where: { joiningYear },
    });
    const employeeSequence = (maxSeq._max.employeeSequence || 0) + 1;

    const companyPrefix = this.configService.get('COMPANY_PREFIX') || 'OI';
    const loginId = generateLoginId(
      companyPrefix,
      data.firstName,
      data.lastName,
      joiningYear,
      employeeSequence,
    );

    // Generate temporary password
    const tempPassword = generatePassword(12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const role = data.role || Role.EMPLOYEE;

    // Create user + employee in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          loginId,
          passwordHash,
          role,
          mustChangePassword: true,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          departmentId: data.departmentId || null,
          designationId: data.designationId || null,
          managerId: data.managerId || null,
          joiningDate,
          joiningYear,
          employeeSequence,
          profilePicture: data.profilePicture,
        },
      });

      // Create leave allocations for current year
      const leaveTypes = await tx.leaveType.findMany({ where: { isActive: true } });
      for (const lt of leaveTypes) {
        if (lt.defaultAllocation > 0) {
          await tx.leaveAllocation.create({
            data: {
              employeeId: employee.id,
              leaveTypeId: lt.id,
              year: new Date().getFullYear(),
              allocated: lt.defaultAllocation,
              remaining: lt.defaultAllocation,
            },
          });
        }
      }

      // Assign default work schedule
      const defaultSchedule = await tx.workSchedule.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultSchedule) {
        await tx.employee.update({
          where: { id: employee.id },
          data: { workScheduleId: defaultSchedule.id },
        });
      }

      return { user, employee };
    });

    return {
      employee: result.employee,
      loginId,
      temporaryPassword: tempPassword,
    };
  }

  async findAll(filters?: {
    search?: string;
    departmentId?: string;
  }) {
    const where: any = { isActive: true };

    if (filters?.search) {
      const s = filters.search;
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { user: { loginId: { contains: s, mode: 'insensitive' } } },
      ];
    }

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    return this.prisma.employee.findMany({
      where,
      include: {
        user: { select: { loginId: true, role: true } },
        department: true,
        designation: true,
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            loginId: true,
            role: true,
            lastPasswordChange: true,
            mfaEnabled: true,
            createdAt: true,
          },
        },
        department: true,
        designation: true,
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
        workSchedule: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      personalEmail: string;
      departmentId: string;
      designationId: string;
      managerId: string;
      profilePicture: string;
      dateOfBirth: string;
      gender: string;
      maritalStatus: string;
      nationality: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      aboutMe: string;
      experience: string;
      skills: string;
      certifications: string;
      hobbies: string;
      workScheduleId: string;
    }>,
    currentUser: { role: string; employeeId?: string },
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Employee can only edit their own limited fields
    if (currentUser.role === 'EMPLOYEE') {
      if (currentUser.employeeId !== id) {
        throw new ForbiddenException('You can only edit your own profile');
      }
      // Only allow specific fields
      const allowed = ['address', 'city', 'state', 'zipCode', 'country', 'phone', 'personalEmail', 'profilePicture'];
      const filtered: any = {};
      for (const key of allowed) {
        if ((data as any)[key] !== undefined) {
          filtered[key] = (data as any)[key];
        }
      }
      return this.prisma.employee.update({ where: { id }, data: filtered });
    }

    // HR and Admin can edit most fields
    const updateData: any = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    return this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        designation: true,
        user: { select: { loginId: true, role: true } },
      },
    });
  }

  async getAttendanceStatus(employeeId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for approved leave today
    const leave = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    if (leave) return 'LEAVE';

    // Check attendance
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (attendance && attendance.checkIn) return 'PRESENT';
    return 'ABSENT';
  }

  async getAllWithStatus() {
    const employees = await this.findAll();
    const result = [];

    for (const emp of employees) {
      const status = await this.getAttendanceStatus(emp.id);
      result.push({ ...emp, attendanceStatus: status });
    }

    return result;
  }

  async getDesignations() {
    return this.prisma.designation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createDesignation(name: string) {
    return this.prisma.designation.create({ data: { name } });
  }
}
