import {
  Controller,
  Get,
  Post,
  Put,
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
import { Role } from '@prisma/client';
import { EmployeeService } from './employee.service';

@Controller('employees')
@UseGuards(AuthGuard('jwt'), ForcePasswordChangeGuard, RolesGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.employeeService.getAllWithStatus();
  }

  @Get('designations')
  getDesignations() {
    return this.employeeService.getDesignations();
  }

  @Post('designations')
  @Roles(Role.ADMIN, Role.HR)
  createDesignation(@Body() body: { name: string }) {
    return this.employeeService.createDesignation(body.name);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.employeeService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(
    @Body()
    body: {
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
    },
  ) {
    return this.employeeService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.employeeService.update(id, body, req.user);
  }
}
