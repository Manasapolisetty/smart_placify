import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentProfile } from '../pages/student/StudentProfile';
import { AcademicRecords } from '../pages/student/AcademicRecords';
import { FindJobs } from '../pages/student/FindJobs';
import { JobDetails } from '../pages/student/JobDetails';
import { StudentApplications } from '../pages/student/Applications';
import { StudentInterviews } from '../pages/student/Interviews';
import { NotificationsPage } from '../pages/student/Notifications';
import { SettingsPage } from '../pages/student/Settings';

// Recruiter Pages
import { RecruiterDashboard } from '../pages/recruiter/RecruiterDashboard';
import { CompanyProfile } from '../pages/recruiter/CompanyProfile';
import { ManageJobs } from '../pages/recruiter/ManageJobs';
import { CreateJob } from '../pages/recruiter/CreateJob';
import { RecruiterApplications } from '../pages/recruiter/RecruiterApplications';
import { RecruiterInterviews } from '../pages/recruiter/RecruiterInterviews';

// Placement Officer Pages
import { PlacementDashboard } from '../pages/placement/PlacementDashboard';
import { PlacementStudentsList } from '../pages/placement/StudentsList';
import { CorporatePartners } from '../pages/placement/CorporatePartners';
import { PlacementDrives } from '../pages/placement/PlacementDrives';
import { PlacementTracking } from '../pages/placement/PlacementTracking';
import { PlacementAnalytics } from '../pages/placement/PlacementAnalytics';
import { PlacementReports } from '../pages/placement/PlacementReports';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminDepartments } from '../pages/admin/AdminDepartments';
import { AdminAuditLogs } from '../pages/admin/AdminAuditLogs';

// Shared
import { NotFound } from '../pages/shared/NotFound';

export const AppRoutes = () => {
  const { user, role } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Default Landing Redirect */}
      <Route
        path="/"
        element={<Navigate to={user ? `/${role}/dashboard` : '/login'} replace />}
      />

      {/* Protected App Shell Layout */}
      <Route element={<MainLayout />}>
        {/* Student Module */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/academics" element={<AcademicRecords />} />
          <Route path="/student/jobs" element={<FindJobs />} />
          <Route path="/student/jobs/:id" element={<JobDetails />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/interviews" element={<StudentInterviews />} />
          <Route path="/student/notifications" element={<NotificationsPage />} />
          <Route path="/student/settings" element={<SettingsPage />} />
        </Route>

        {/* Recruiter Module */}
        <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/recruiter/company" element={<CompanyProfile />} />
          <Route path="/recruiter/jobs" element={<ManageJobs />} />
          <Route path="/recruiter/jobs/create" element={<CreateJob />} />
          <Route path="/recruiter/jobs/:id" element={<ManageJobs />} />
          <Route path="/recruiter/applications" element={<RecruiterApplications />} />
          <Route path="/recruiter/candidates/:id" element={<RecruiterApplications />} />
          <Route path="/recruiter/interviews" element={<RecruiterInterviews />} />
          <Route path="/recruiter/notifications" element={<NotificationsPage />} />
          <Route path="/recruiter/settings" element={<SettingsPage />} />
        </Route>

        {/* Placement Officer Module */}
        <Route element={<ProtectedRoute allowedRoles={['placement']} />}>
          <Route path="/placement/dashboard" element={<PlacementDashboard />} />
          <Route path="/placement/students" element={<PlacementStudentsList />} />
          <Route path="/placement/companies" element={<CorporatePartners />} />
          <Route path="/placement/drives" element={<PlacementDrives />} />
          <Route path="/placement/drives/:id" element={<PlacementDrives />} />
          <Route path="/placement/applications" element={<PlacementTracking />} />
          <Route path="/placement/interviews" element={<PlacementDrives />} />
          <Route path="/placement/placements" element={<PlacementTracking />} />
          <Route path="/placement/analytics" element={<PlacementAnalytics />} />
          <Route path="/placement/reports" element={<PlacementReports />} />
          <Route path="/placement/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin Module */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/students" element={<PlacementStudentsList />} />
          <Route path="/admin/recruiters" element={<CompanyProfile />} />
          <Route path="/admin/companies" element={<CorporatePartners />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/admin/courses" element={<AdminDepartments />} />
          <Route path="/admin/jobs" element={<ManageJobs />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/analytics" element={<PlacementAnalytics />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
