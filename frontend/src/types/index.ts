export interface User {
  id: string;
  loginId: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  mustChangePassword: boolean;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  personalEmail?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  joiningDate: string;
  joiningYear: number;
  employeeSequence: number;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  workScheduleId?: string;
  aboutMe?: string;
  experience?: string;
  skills?: string;
  certifications?: string;
  hobbies?: string;
  isActive: boolean;
  user: {
    loginId: string;
    role: string;
    lastPasswordChange?: string;
    mfaEnabled?: boolean;
  };
  department?: { id: string; name: string };
  designation?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string };
  workSchedule?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'LEAVE';
}

export interface Department {
  id: string;
  name: string;
}

export interface Designation {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakMinutes: number;
  workHours: number;
  extraHours: number;
  status: string;
  employee?: {
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
}

export interface LeaveType {
  id: string;
  name: string;
  label: string;
  defaultAllocation: number;
  requiresAttachment: boolean;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  remaining: number;
  leaveType: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  attachment?: string;
  leaveType: LeaveType;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
}

export interface SalaryBreakdown {
  monthlyWage: number;
  basicPercent: number;
  hraPercent: number;
  standardAllowancePercent: number;
  performanceBonusPercent: number;
  ltaPercent: number;
  residualAllowance: number;
  pfPercent: number;
  professionalTax: number;
  otherDeductions: number;
  breakdown: {
    basic: number;
    hra: number;
    standardAllowance: number;
    performanceBonus: number;
    lta: number;
    residualAllowance: number;
    grossSalary: number;
    pfDeduction: number;
    professionalTax: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
