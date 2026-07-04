import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async generatePayroll(month: number, year: number) {
    // Create or find payroll run
    let payrollRun = await this.prisma.payrollRun.findUnique({
      where: { month_year: { month, year } },
    });

    if (!payrollRun) {
      payrollRun = await this.prisma.payrollRun.create({
        data: { month, year },
      });
    }

    // Get all active employees with salary structures
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: { salaryStructure: true },
    });

    const entries = [];

    for (const emp of employees) {
      if (!emp.salaryStructure) continue;

      const salary = emp.salaryStructure;

      // Calculate working days and attendance
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      let totalWorkingDays = 0;
      const d = new Date(startDate);
      while (d <= endDate) {
        if (d.getDay() !== 0 && d.getDay() !== 6) totalWorkingDays++;
        d.setDate(d.getDate() + 1);
      }

      // Get attendance for the month
      const attendance = await this.prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      const presentDays = attendance.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE',
      ).length;
      const halfDays = attendance.filter((a) => a.status === 'HALF_DAY').length;
      const leaveDays = attendance.filter((a) => a.status === 'LEAVE').length;
      const payableDays = presentDays + Math.ceil(halfDays * 0.5) + leaveDays;
      const absentDays = totalWorkingDays - payableDays;

      // Calculate prorated salary
      const ratio = payableDays / totalWorkingDays;
      const basic = Math.round((salary.monthlyWage * salary.basicPercent / 100) * ratio);
      const hra = Math.round((salary.monthlyWage * salary.hraPercent / 100) * ratio);
      const stdAllowance = Math.round(
        (salary.monthlyWage * salary.standardAllowancePercent / 100) * ratio,
      );
      const bonus = Math.round(
        (salary.monthlyWage * salary.performanceBonusPercent / 100) * ratio,
      );
      const lta = Math.round((salary.monthlyWage * salary.ltaPercent / 100) * ratio);
      const residual = Math.round(salary.residualAllowance * ratio);

      const grossSalary = basic + hra + stdAllowance + bonus + lta + residual;
      const pfDeduction = Math.round((basic * salary.pfPercent) / 100);
      const totalDeductions = pfDeduction + salary.professionalTax + salary.otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      const entry = await this.prisma.payrollEntry.upsert({
        where: {
          payrollRunId_employeeId: {
            payrollRunId: payrollRun.id,
            employeeId: emp.id,
          },
        },
        create: {
          payrollRunId: payrollRun.id,
          employeeId: emp.id,
          monthlyWage: salary.monthlyWage,
          basicSalary: basic,
          hra,
          standardAllowance: stdAllowance,
          performanceBonus: bonus,
          lta,
          residualAllowance: residual,
          grossSalary,
          pfDeduction,
          professionalTax: salary.professionalTax,
          otherDeductions: salary.otherDeductions,
          totalDeductions,
          netSalary,
          payableDays,
          totalWorkingDays,
          leaveDays,
          absentDays,
        },
        update: {
          monthlyWage: salary.monthlyWage,
          basicSalary: basic,
          hra,
          standardAllowance: stdAllowance,
          performanceBonus: bonus,
          lta,
          residualAllowance: residual,
          grossSalary,
          pfDeduction,
          professionalTax: salary.professionalTax,
          otherDeductions: salary.otherDeductions,
          totalDeductions,
          netSalary,
          payableDays,
          totalWorkingDays,
          leaveDays,
          absentDays,
        },
      });

      entries.push(entry);
    }

    return { payrollRun, entries };
  }

  async getPayrollRun(month: number, year: number) {
    return this.prisma.payrollRun.findUnique({
      where: { month_year: { month, year } },
      include: {
        entries: {
          include: {
            employee: {
              select: { firstName: true, lastName: true, department: true },
            },
          },
        },
      },
    });
  }

  async getMyPayslip(employeeId: string, month: number, year: number) {
    return this.prisma.payrollEntry.findFirst({
      where: {
        employeeId,
        payrollRun: { month, year },
      },
      include: { payrollRun: true },
    });
  }
}
