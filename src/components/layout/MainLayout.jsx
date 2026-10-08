import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, ShieldCheck, Briefcase, GraduationCap, Check } from 'lucide-react';

export const MainLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const { role, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = async (targetRole) => {
    await switchRole(targetRole);
    setIsRoleModalOpen(false);
    navigate(`/${targetRole}/dashboard`);
  };

  const rolesList = [
    {
      id: 'student',
      title: 'Student Portal',
      description: 'Rahul Kumar (Computer Science & Engineering)',
      icon: GraduationCap,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      id: 'recruiter',
      title: 'Recruiter Portal',
      description: 'Priya Sharma (TechCorp Talent Acquisition)',
      icon: Briefcase,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      id: 'placement',
      title: 'Placement Officer',
      description: 'Dr. Aris V. Nair (Head of T&P)',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      id: 'admin',
      title: 'Platform Administrator',
      description: 'System Admin (User & Audit Management)',
      icon: ShieldCheck,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopNavbar
          setIsMobileOpen={setIsMobileOpen}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Role Switcher Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Switch User Role Persona"
        size="md"
      >
        <p className="text-xs text-slate-500 mb-4">
          Select any of the 4 role personas to test and inspect the corresponding module dashboard and workflows.
        </p>

        <div className="grid gap-3">
          {rolesList.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${r.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
