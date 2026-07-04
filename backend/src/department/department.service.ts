import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    return this.prisma.department.create({ data: { name } });
  }

  async update(id: string, name: string) {
    return this.prisma.department.update({ where: { id }, data: { name } });
  }

  async delete(id: string) {
    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
