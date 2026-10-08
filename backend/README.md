# SmartPlacify Backend API

Production-ready REST API and PostgreSQL backend for the **SmartPlacify** Campus Placement Management Platform.

---

## 1. Project Overview

SmartPlacify connects students, recruiters, placement officers, and platform administrators in a unified placement management ecosystem. This backend provides secure authentication, role-based access control (RBAC), and relational data persistence using PostgreSQL 16.

### Key Capabilities:
- **Authentication**: JWT authentication with bcrypt password hashing and role validation.
- **Role-Based Authorization**: Distinct access controls for `STUDENT`, `RECRUITER`, `PLACEMENT_OFFICER`, and `ADMIN`.
- **Student Portal**: Profile management, academic records, skills, projects, certifications, resume tracking, job search, and real-time application tracking.
- **Job Engine**: Job listings, eligibility evaluation (CGPA, backlogs, department checks), and duplicate application prevention.
- **Recruiter Portal**: Candidate search, shortlisting, application pipeline, and job management.
- **Placement Officer Portal**: Drives, campus analytics, department metrics, and placement statistics.
- **Administration**: User governance, departments, audit logging, and platform metrics.

---

## 2. Requirements

- **Node.js**: v18.x or v20.x+
- **PostgreSQL**: 16.x
- **Package Manager**: npm or yarn

---

## 3. Technology Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (`pg` Connection Pool)
- **Security**: Helmet, CORS, bcryptjs, JSON Web Tokens (`jsonwebtoken`)
- **Validation**: `express-validator`
- **Logging**: Morgan

---

## 4. Environment Variables

Create a `.env` file in the `backend/` directory using `.env.example` as a template:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartplacify_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

JWT_SECRET=YOUR_SECURE_JWT_SECRET_KEY
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

> **Security Note:** Never commit `.env` or hardcode production credentials.

---

## 5. Database Setup & Migration

### Step 1: Run Schema Migration
Creates all 22 normalized relational tables, foreign key constraints, unique indexes, and audit tables in `smartplacify_db`:

```bash
cd backend
npm run migrate
```

### Step 2: Seed Demo Data
Populates the database with demo accounts, initial departments, courses, job openings, applications, interviews, and analytics data:

```bash
npm run seed
```

---

## 6. Starting the Server

### Development Mode (with auto-reload via Nodemon):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server listens on **`http://localhost:5000`**.

---

## 7. Demo Accounts

All seeded demo accounts use the default password: **`password123`**

| Role | Email | Password |
|---|---|---|
| **Student** | `rahul.kumar@university.edu.in` | `password123` |
| **Recruiter** | `priya.sharma@techcorp.com` | `password123` |
| **Placement Officer** | `placement.head@university.edu.in` | `password123` |
| **Administrator** | `admin@smartplacify.edu.in` | `password123` |

---

## 8. API Endpoints Reference

### Health Checks
- `GET /api/health` - Check API server liveness
- `GET /api/health/db` - Test PostgreSQL connection status

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register student or recruiter account
- `POST /api/auth/login` - Authenticate with email and password
- `GET /api/auth/me` - Get current authenticated user profile
- `POST /api/auth/logout` - Logout session

### Student Module (`/api/students`)
- `GET /api/students/profile` - Current student profile with metrics
- `GET /api/students/profile/:id` - Specific student profile
- `PUT /api/students/profile` - Update student profile
- `GET /api/students/academics` - Academic marks, SGPA & CGPA
- `POST /api/students/academics` - Add/update academics
- `GET /api/students/skills` - List student skills
- `POST /api/students/skills` - Add skill
- `DELETE /api/students/skills/:id` - Delete skill
- `GET /api/students/projects` - List student projects
- `POST /api/students/projects` - Create project
- `PUT /api/students/projects/:id` - Update project
- `DELETE /api/students/projects/:id` - Delete project
- `GET /api/students/certifications` - List certifications
- `POST /api/students/certifications` - Add certification
- `GET /api/students/resumes` - List resumes
- `POST /api/students/resumes/upload` - Upload new resume
- `GET /api/students/applications` - Student application history
- `GET /api/students/interviews` - Student interview schedule
- `GET /api/students/notifications` - Student notifications

### Jobs (`/api/jobs`)
- `GET /api/jobs` - List jobs with search, department & salary filters
- `GET /api/jobs/:id` - Job details and eligibility criteria
- `POST /api/jobs/:jobId/apply` - Student apply for job
- `POST /api/jobs` - Create job listing (Recruiter/Admin)
- `PUT /api/jobs/:id` - Update job listing (Recruiter/Admin)
- `DELETE /api/jobs/:id` - Delete job listing (Recruiter/Admin)

### Applications (`/api/applications`)
- `GET /api/applications` - List applications (filtered by role)
- `GET /api/applications/:id` - Application details and timeline
- `POST /api/applications` - Student apply endpoint
- `PUT /api/applications/:id/status` - Update candidate stage (Shortlisted, Rejected, Interview, Selected)

### Recruiters (`/api/recruiters` and `/api/recruiter`)
- `GET /api/recruiters/profile` - Recruiter profile
- `PUT /api/recruiters/profile` - Update recruiter profile
- `GET /api/recruiters/jobs` - Recruiter job postings
- `GET /api/recruiters/candidates` - Candidate applicant pipeline
- `POST /api/recruiters/candidates/:id/shortlist` - Shortlist candidate
- `POST /api/recruiters/candidates/:id/reject` - Reject candidate
- `GET /api/recruiters/company/:id` - Associated company profile

### Companies (`/api/companies`)
- `GET /api/companies` - List partner companies
- `GET /api/companies/:id` - Company details and hired count
- `PUT /api/companies/:id` - Update company profile

### Interviews (`/api/interviews`)
- `GET /api/interviews` - List scheduled interviews
- `GET /api/interviews/:id` - Interview details
- `POST /api/interviews` - Schedule interview
- `PUT /api/interviews/:id` - Update interview schedule
- `PATCH /api/interviews/:id/status` - Update interview status / feedback
- `DELETE /api/interviews/:id` - Cancel / delete interview

### Placement Officer (`/api/placement` & `/api/placement-drives`)
- `GET /api/placement/students` - Full student roster with placement status
- `GET /api/placement/companies` - Corporate hiring partners
- `GET /api/placement/jobs` - All campus job openings
- `GET /api/placement/applications` - Application tracking across drives
- `GET /api/placement/interviews` - Campus interview tracking
- `GET /api/placement/placements` - Offers & successful placements
- `GET /api/placement/analytics` - Department metrics & CTC distribution
- `GET /api/placement/drives` - Campus recruitment drives
- `POST /api/placement/drives` - Schedule recruitment drive
- `GET /api/placement/reports/export` - Export placement summary

### Administration (`/api/admin`)
- `GET /api/admin/users` - User directory
- `POST /api/admin/users` - Create user with specific role
- `PUT /api/admin/users/:id` - Update user details
- `PATCH /api/admin/users/:id/role` - Update user role
- `PATCH /api/admin/users/:id/status` - Toggle Active / Inactive
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/departments` - Academic departments
- `GET /api/admin/courses` - Academic courses
- `GET /api/admin/analytics` - Platform metrics
- `GET /api/admin/audit-logs` - System audit log history

---

## 9. Testing & Quality Assurance

Run manual endpoint tests with curl or automated test scripts:

```bash
# Health check
curl -X GET http://localhost:5000/api/health

# DB check
curl -X GET http://localhost:5000/api/health/db

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul.kumar@university.edu.in","password":"password123"}'
```
