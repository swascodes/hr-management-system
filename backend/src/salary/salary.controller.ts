import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ForcePasswordChangeGuard } from '../auth/force-password-change.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { SalaryService } from './salary.service';

@Controller('salary')
@UseGuards(AuthGuard('jwt'), ForcePasswordChangeGuard, RolesGuard)
export class SalaryController {
  constructor(private salaryService: SalaryService) {}

  @Get('my')
  async getMySalary(@Request() req: any) {
    // HR cannot view salary
    if (req.user.role === 'HR') {
      throw new ForbiddenException('HR officers cannot access salary information');
    }
    return this.salaryService.getSalaryStructure(req.user.employeeId);
  }

  @Get(':employeeId')
  @Roles(Role.ADMIN)
  async getSalary(@Param('employeeId') employeeId: string) {
    return this.salaryService.getSalaryStructure(employeeId);
  }

  @Post(':employeeId')
  @Roles(Role.ADMIN)
  async configureSalary(
    @Param('employeeId') employeeId: string,
    @Body() body: any,
  ) {
    return this.salaryService.configureSalary(employeeId, body);
  }
}
