import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ForcePasswordChangeGuard } from '../auth/force-password-change.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), ForcePasswordChangeGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Request() req: any) {
    return this.attendanceService.checkIn(req.user.employeeId);
  }

  @Post('check-out')
  checkOut(@Request() req: any) {
    return this.attendanceService.checkOut(req.user.employeeId);
  }

  @Get('my')
  getMyAttendance(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.getMyAttendance(
      req.user.employeeId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }

  @Get('today')
  getTodayStatus(@Request() req: any) {
    return this.attendanceService.getTodayStatus(req.user.employeeId);
  }

  @Get('all')
  @Roles(Role.ADMIN, Role.HR)
  getAllAttendance(
    @Query('employeeId') employeeId?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.attendanceService.getAllAttendance({
      employeeId,
      date,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      departmentId,
    });
  }
}
