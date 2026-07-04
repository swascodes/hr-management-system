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
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(AuthGuard('jwt'), ForcePasswordChangeGuard, RolesGuard)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Post('generate')
  @Roles(Role.ADMIN)
  generate(@Query('month') month: string, @Query('year') year: string) {
    return this.payrollService.generatePayroll(parseInt(month), parseInt(year));
  }

  @Get('run')
  @Roles(Role.ADMIN)
  getPayrollRun(@Query('month') month: string, @Query('year') year: string) {
    return this.payrollService.getPayrollRun(parseInt(month), parseInt(year));
  }

  @Get('my')
  getMyPayslip(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.payrollService.getMyPayslip(
      req.user.employeeId,
      parseInt(month),
      parseInt(year),
    );
  }
}
