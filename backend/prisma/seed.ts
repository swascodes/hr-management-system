import 'dotenv/config';
import { PrismaClient, Role, LeaveTypeName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('🌱 Seeding HR-Made Easy database...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { loginId: 'ADMIN' },
    update: {},
    create: {
      loginId: 'ADMIN',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  // Create admin employee record
  await prisma.employee.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@hrmadeeasy.com',
      joiningDate: new Date(),
      joiningYear: new Date().getFullYear(),
      employeeSequence: 0,
    },
  });

  console.log('✅ Admin user created (Login: ADMIN, Password: Admin@12345)');

  // 2. Create Departments
  const departments = [
    'Engineering',
    'Human Resources',
    'Finance',
    'Marketing',
    'Operations',
    'Sales',
    'Product',
    'Design',
  ];

  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Departments created');

  // 3. Create Designations
  const designations = [
    'Software Engineer',
    'Senior Software Engineer',
    'Tech Lead',
    'Engineering Manager',
    'HR Manager',
    'HR Executive',
    'Finance Manager',
    'Accountant',
    'Marketing Manager',
    'Sales Executive',
    'Product Manager',
    'Designer',
    'Intern',
  ];

  for (const name of designations) {
    await prisma.designation.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Designations created');

  // 4. Create Work Schedules
  await prisma.workSchedule.upsert({
    where: { name: 'General Shift' },
    update: {},
    create: {
      name: 'General Shift',
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
      workingDays: '1,2,3,4,5',
    },
  });

  await prisma.workSchedule.upsert({
    where: { name: 'Night Shift' },
    update: {},
    create: {
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      breakMinutes: 60,
      workingDays: '1,2,3,4,5',
    },
  });

  await prisma.workSchedule.upsert({
    where: { name: 'Flexible Shift' },
    update: {},
    create: {
      name: 'Flexible Shift',
      startTime: '10:00',
      endTime: '19:00',
      breakMinutes: 60,
      workingDays: '1,2,3,4,5',
    },
  });
  console.log('✅ Work schedules created');

  // 5. Create Leave Types
  await prisma.leaveType.upsert({
    where: { name: LeaveTypeName.PAID_TIME_OFF },
    update: {},
    create: {
      name: LeaveTypeName.PAID_TIME_OFF,
      label: 'Paid Time Off',
      defaultAllocation: 24,
      requiresAttachment: false,
    },
  });

  await prisma.leaveType.upsert({
    where: { name: LeaveTypeName.SICK_LEAVE },
    update: {},
    create: {
      name: LeaveTypeName.SICK_LEAVE,
      label: 'Sick Leave',
      defaultAllocation: 7,
      requiresAttachment: true,
    },
  });

  await prisma.leaveType.upsert({
    where: { name: LeaveTypeName.UNPAID_LEAVE },
    update: {},
    create: {
      name: LeaveTypeName.UNPAID_LEAVE,
      label: 'Unpaid Leave',
      defaultAllocation: 0,
      requiresAttachment: false,
    },
  });
  console.log('✅ Leave types created');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Admin Credentials:');
  console.log('   Login ID: ADMIN');
  console.log('   Password: Admin@12345');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
