import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Briefcase,
  FileCheck,
  Calendar,
  Bell,
  Settings,
  Building2,
  Users,
  PlusCircle,
  BarChart3,
  Award,
  ShieldCheck,
  BookOpen,
  LogOut,
  RefreshCw
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, onOpenRoleModal }) => {
  const { user, role, logout } = useAuth();

  // Navigation configurations per role
  const roleNavItems = {
    student: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
      { label: 'My Profile', icon: User, path: '/student/profile' },
      { label: 'Academic Records', icon: GraduationCap, path: '/student/academics' },
      { label: 'Find Jobs', icon: Briefcase, path: '/student/jobs' },
      { label: 'My Applications', icon: FileCheck, path: '/student/applications' },
      { label: 'Interviews', icon: Calendar, path: '/student/interviews' },
      { label: 'Notifications', icon: Bell, path: '/student/notifications' },
      { label: 'Settings', icon: Settings, path: '/student/settings' },
    ],

    recruiter: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/recruiter/dashboard' },
      { label: 'Company Profile', icon: Building2, path: '/recruiter/company' },
      { label: 'Manage Jobs', icon: Briefcase, path: '/recruiter/jobs' },
      { label: 'Post New Job', icon: PlusCircle, path: '/recruiter/jobs/create' },
      { label: 'Applications', icon: Users, path: '/recruiter/applications' },
      { label: 'Interviews', icon: Calendar, path: '/recruiter/interviews' },
      { label: 'Notifications', icon: Bell, path: '/recruiter/notifications' },
      { label: 'Settings', icon: Settings, path: '/recruiter/settings' },
    ],

    placement: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/placement/dashboard' },
      { label: 'Students', icon: Users, path: '/placement/students' },
      { label: 'Companies', icon: Building2, path: '/placement/companies' },
      { label: 'Placement Drives', icon: Award, path: '/placement/drives' },
      { label: 'Applications', icon: FileCheck, path: '/placement/applications' },
      { label: 'Interviews', icon: Calendar, path: '/placement/interviews' },
      { label: 'Placement Analytics', icon: BarChart3, path: '/placement/analytics' },
      { label: 'Reports', icon: BookOpen, path: '/placement/reports' },
    ],

    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { label: 'User Directory', icon: Users, path: '/admin/users' },
      { label: 'Students List', icon: GraduationCap, path: '/admin/students' },
      { label: 'Recruiters', icon: Building2, path: '/admin/recruiters' },
      { label: 'Departments', icon: BookOpen, path: '/admin/departments' },
      { label: 'All Jobs', icon: Briefcase, path: '/admin/jobs' },
      { label: 'Audit Logs', icon: ShieldCheck, path: '/admin/audit-logs' },
      { label: 'System Settings', icon: Settings, path: '/admin/settings' },
    ]
  };

  const currentNav = roleNavItems[role] || roleNavItems.student;

  const roleLabelMap = {
    student: 'Student Portal',
    recruiter: 'Recruiter Portal',
    placement: 'Placement Officer',
    admin: 'Platform Admin'
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-600/40">
                S
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white leading-none">
                  SMARTPLACIFY
                </h1>
                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mt-1">
                  {roleLabelMap[role] || 'Placement Suite'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Role Switcher Banner */}
          <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-300 font-medium">
              Role: <span className="font-bold text-indigo-300 capitalize">{role}</span>
            </div>
            <button
              onClick={onOpenRoleModal}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 px-2 py-1 rounded-md transition-all border border-indigo-800/50"
            >
              <RefreshCw className="w-3 h-3" />
              Switch
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
            {currentNav.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer Account Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-100 truncate">{user?.name}</h4>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
