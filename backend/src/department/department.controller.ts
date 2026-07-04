import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { DepartmentService } from './department.service';

@Controller('departments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DepartmentController {
  constructor(private departmentService: DepartmentService) {}

  @Get()
  findAll() {
    return this.departmentService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() body: { name: string }) {
    return this.departmentService.create(body.name);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: { name: string }) {
    return this.departmentService.update(id, body.name);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string) {
    return this.departmentService.delete(id);
  }
}
