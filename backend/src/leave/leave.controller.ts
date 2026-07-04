import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ForcePasswordChangeGuard } from '../auth/force-password-change.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, LeaveStatus } from '@prisma/client';
import { LeaveService } from './leave.service';

@Controller('leave')
@UseGuards(AuthGuard('jwt'), ForcePasswordChangeGuard, RolesGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Get('types')
  getLeaveTypes() {
    return this.leaveService.getLeaveTypes();
  }

  @Get('my/allocations')
  getMyAllocations(@Request() req: any, @Query('year') year?: string) {
    return this.leaveService.getMyAllocations(
      req.user.employeeId,
      year ? parseInt(year) : undefined,
    );
  }

  @Get('my/requests')
  getMyRequests(@Request() req: any) {
    return this.leaveService.getMyRequests(req.user.employeeId);
  }

  @Get('my/calendar')
  getCalendar(@Request() req: any, @Query('year') year?: string) {
    return this.leaveService.getCalendarData(
      req.user.employeeId,
      year ? parseInt(year) : new Date().getFullYear(),
    );
  }

  @Post('request')
  createRequest(@Request() req: any, @Body() body: any) {
    return this.leaveService.createRequest({
      employeeId: req.user.employeeId,
      ...body,
    });
  }

  @Get('all')
  @Roles(Role.ADMIN, Role.HR)
  getAllRequests(@Query('status') status?: LeaveStatus) {
    return this.leaveService.getAllRequests(status);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.HR)
  approve(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { comments?: string },
  ) {
    return this.leaveService.approveRequest(id, req.user.id, body.comments);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.HR)
  reject(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { comments?: string },
  ) {
    return this.leaveService.rejectRequest(id, req.user.id, body.comments);
  }
}
