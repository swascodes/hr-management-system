import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  async getSalaryStructure(employeeId: string) {
    const structure = await this.prisma.salaryStructure.findUnique({
      where: { employeeId },
    });

    if (!structure) return null;

    return this.calculateBreakdown(structure);
  }

  async configureSalary(
    employeeId: string,
    data: {
      monthlyWage: number;
      basicPercent?: number;
      hraPercent?: number;
      standardAllowancePercent?: number;
      performanceBonusPercent?: number;
      ltaPercent?: number;
      pfPercent?: number;
      professionalTax?: number;
      otherDeductions?: number;
    },
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    const basicPercent = data.basicPercent ?? 50;
    const hraPercent = data.hraPercent ?? 25;
    const standardAllowancePercent = data.standardAllowancePercent ?? 16.67;
    const performanceBonusPercent = data.performanceBonusPercent ?? 8.33;
    const ltaPercent = data.ltaPercent ?? 0;
    const totalPercent =
      basicPercent + hraPercent + standardAllowancePercent + performanceBonusPercent + ltaPercent;
    const residualPercent = 100 - totalPercent;
    const residualAllowance =
      Math.round((data.monthlyWage * residualPercent) / 100 * 100) / 100;

    const salaryData = {
      monthlyWage: data.monthlyWage,
      basicPercent,
      hraPercent,
      standardAllowancePercent,
      performanceBonusPercent,
      ltaPercent,
      residualAllowance: Math.max(0, residualAllowance),
      pfPercent: data.pfPercent ?? 12,
      professionalTax: data.professionalTax ?? 200,
      otherDeductions: data.otherDeductions ?? 0,
    };

    const structure = await this.prisma.salaryStructure.upsert({
      where: { employeeId },
      create: { employeeId, ...salaryData },
      update: salaryData,
    });

    return this.calculateBreakdown(structure);
  }

  private calculateBreakdown(structure: any) {
    const wage = structure.monthlyWage;

    const basic = Math.round((wage * structure.basicPercent) / 100);
    const hra = Math.round((wage * structure.hraPercent) / 100);
    const standardAllowance = Math.round(
      (wage * structure.standardAllowancePercent) / 100,
    );
    const performanceBonus = Math.round(
      (wage * structure.performanceBonusPercent) / 100,
    );
    const lta = Math.round((wage * structure.ltaPercent) / 100);
    const residual = structure.residualAllowance;

    const grossSalary = basic + hra + standardAllowance + performanceBonus + lta + residual;

    const pfDeduction = Math.round((basic * structure.pfPercent) / 100);
    const totalDeductions =
      pfDeduction + structure.professionalTax + structure.otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    return {
      ...structure,
      breakdown: {
        basic,
        hra,
        standardAllowance,
        performanceBonus,
        lta,
        residualAllowance: residual,
        grossSalary,
        pfDeduction,
        professionalTax: structure.professionalTax,
        otherDeductions: structure.otherDeductions,
        totalDeductions,
        netSalary,
      },
    };
  }
}
