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
    data: any,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    const wage = data.monthlyWage;
    const calc = (value: number, type: string, base: number) => {
      if (type === 'FIXED') return value;
      return Math.round((base * value) / 100);
    };

    const basic = calc(data.basicValue ?? 50, data.basicType ?? 'PERCENTAGE', wage);
    const hra = calc(data.hraValue ?? 50, data.hraType ?? 'PERCENTAGE', basic);
    const stdAll = calc(data.standardAllowanceValue ?? 4167, data.standardAllowanceType ?? 'FIXED', wage);
    const perfBon = calc(data.performanceBonusValue ?? 8.33, data.performanceBonusType ?? 'PERCENTAGE', wage);
    const lta = calc(data.ltaValue ?? 8.333, data.ltaType ?? 'PERCENTAGE', wage);
    
    const residualAllowance = Math.max(0, wage - (basic + hra + stdAll + perfBon + lta));

    const salaryData = {
      monthlyWage: wage,
      basicValue: data.basicValue ?? 50,
      basicType: data.basicType ?? 'PERCENTAGE',
      hraValue: data.hraValue ?? 50,
      hraType: data.hraType ?? 'PERCENTAGE',
      standardAllowanceValue: data.standardAllowanceValue ?? 4167,
      standardAllowanceType: data.standardAllowanceType ?? 'FIXED',
      performanceBonusValue: data.performanceBonusValue ?? 8.33,
      performanceBonusType: data.performanceBonusType ?? 'PERCENTAGE',
      ltaValue: data.ltaValue ?? 8.333,
      ltaType: data.ltaType ?? 'PERCENTAGE',
      residualAllowance,
      pfValue: data.pfValue ?? 12,
      pfType: data.pfType ?? 'PERCENTAGE',
      professionalTaxValue: data.professionalTaxValue ?? 200,
      professionalTaxType: data.professionalTaxType ?? 'FIXED',
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

    const calc = (value: number, type: string, base: number) => {
      if (type === 'FIXED') return value;
      return Math.round((base * value) / 100);
    };

    const basic = calc(structure.basicValue, structure.basicType, wage);
    const hra = calc(structure.hraValue, structure.hraType, basic); // HRA is based on Basic
    const standardAllowance = calc(structure.standardAllowanceValue, structure.standardAllowanceType, wage);
    const performanceBonus = calc(structure.performanceBonusValue, structure.performanceBonusType, wage);
    const lta = calc(structure.ltaValue, structure.ltaType, wage);
    
    const fixedAllowance = Math.max(0, wage - (basic + hra + standardAllowance + performanceBonus + lta));
    const grossSalary = basic + hra + standardAllowance + performanceBonus + lta + fixedAllowance;

    const pfDeduction = calc(structure.pfValue, structure.pfType, wage);
    const professionalTax = calc(structure.professionalTaxValue, structure.professionalTaxType, wage);
    const otherDeductions = structure.otherDeductions;

    const totalDeductions = pfDeduction + professionalTax + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    return {
      ...structure,
      residualAllowance: fixedAllowance,
      breakdown: {
        basic,
        hra,
        standardAllowance,
        performanceBonus,
        lta,
        residualAllowance: fixedAllowance,
        grossSalary,
        pfDeduction,
        professionalTax,
        otherDeductions,
        totalDeductions,
        netSalary,
      },
    };
  }
}
