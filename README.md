# HR-Made Easy

![HR-Made Easy](https://img.shields.io/badge/Status-Active-brightgreen) ![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20NestJS%20%7C%20PostgreSQL-indigo) 

**HR-Made Easy** is a modern, enterprise-ready Human Resource Management System (HRMS) designed for small to medium-sized organizations. It centralizes employee data, streamlines time-off requests, automates payroll calculations, and enforces strict role-based access control.

---

## ✨ Key Features

- **Strict Role-Based Access Control (RBAC):** Three distinct roles (`ADMIN`, `HR`, `EMPLOYEE`) with segmented views and permissions.
- **Secure Authentication System:**
  - No public registration (employees are created by Admin/HR).
  - Auto-generated, immutable Employee Login IDs.
  - Forced password change on first login.
  - Account lockout protection (5 failed attempts trigger a 15-minute lockout).
- **Comprehensive Employee Management:**
  - Visual employee directory with real-time presence indicators.
  - Detailed profiles segregated into tabs: Resume, Private Info, Salary, and Security.
- **Time & Attendance Tracking:**
  - One-click check-in/check-out dashboard.
  - Automatic attendance status calculation (`PRESENT`, `HALF_DAY`, `LATE`, `ABSENT`, `LEAVE`) based on assigned Work Schedules.
- **Leave Management:**
  - Automated leave allocations (PTO, Sick Leave, etc.) on employee onboarding.
  - Request, approve, and reject workflows with visual balance cards.
- **Dynamic Payroll & Salary System:**
  - Salary configurator accessible only by Admins.
  - Auto-prorated salary calculation based on attendance (deducts for absent days, retains 50% for half-days).
  - Immutable monthly payroll snapshots and secure payslips.
- **Audit Trails & Notifications:**
  - Comprehensive, Admin-only audit logs tracking significant system actions (logins, salary changes, leave approvals) with IPs.
  - In-app notification drawer for leave requests and system alerts.

---

## 🏗️ Architecture & Tech Stack

The application is built using a decoupled client-server architecture.

### **Frontend (Client)**
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18, Tailwind CSS, Shadcn UI
- **Language:** TypeScript
- **State & Data Fetching:** React Context API, custom API client with automatic JWT refresh interception.
- **Design:** Modern enterprise aesthetics (Indigo branding, Inter font, micro-animations).

### **Backend (API)**
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 7 (using `@prisma/adapter-pg` driver adapter)
- **Authentication:** Passport.js, JWT (Access & Refresh tokens), Bcrypt for hashing.

### **Infrastructure**
- **Containerization:** Docker & Docker Compose (for the PostgreSQL database).

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### 1. Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- npm or yarn

### 2. Start the Database
The project includes a `docker-compose.yml` file to spin up a PostgreSQL instance automatically.
```bash
docker compose up -d
```
*(The database runs on `localhost:5432` with user `hrms_user` and database `hrms`)*

### 3. Setup the Backend
Navigate to the backend directory, install dependencies, and seed the database.
```bash
cd backend
npm install

# Push the schema to the database and run the seed script
npm run db:reset

# Start the NestJS development server
npm run dev
```
*The backend API will run on `http://localhost:3001`.*

### 4. Setup the Frontend
In a new terminal window, navigate to the frontend directory.
```bash
cd frontend
npm install

# Start the Next.js development server
npm run dev
```
*The frontend dashboard will run on `http://localhost:3000`.*

---

## 🔑 Default Admin Credentials

When you run `npm run db:reset`, the database is seeded with a super admin account. You can log into the frontend using these credentials:

- **Login ID:** `ADMIN`
- **Password:** `Admin@12345`

---

## 🛡️ Security Notes
- **JWT Secrets:** The `.env` files currently contain default development secrets. **Ensure you change these before deploying to production.**
- **Password Policies:** The system enforces strong passwords (minimum 10 characters, including uppercase, lowercase, numbers, and special characters).

---

*Built with ❤️ for modern HR teams.*
