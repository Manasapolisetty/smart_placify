import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { GraduationCap, Briefcase, UserCheck, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export const Login = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('rahul.kumar@university.edu.in');
  const [password, setPassword] = useState('password123');
  const { login, loading } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();

  const handleRoleTab = (r) => {
    setSelectedRole(r);
    if (r === 'student') setEmail('rahul.kumar@university.edu.in');
    else if (r === 'recruiter') setEmail('priya.sharma@techcorp.com');
    else if (r === 'placement') setEmail('placement.head@university.edu.in');
    else if (r === 'admin') setEmail('admin@smartplacify.edu.in');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login({ email, password, role: selectedRole });
      toast.success(`Welcome back, ${user.name}! Logged in as ${selectedRole}.`);
      navigate(`/${selectedRole}/dashboard`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.message || 'Authentication failed. Please check credentials.'));
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'recruiter', label: 'Recruiter', icon: Briefcase },
    { id: 'placement', label: 'Officer', icon: UserCheck },
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white text-center border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-indigo-500/30">
            S
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight">SMARTPLACIFY</h2>
          <p className="text-xs text-indigo-300 font-medium mt-1">Smart Student Management & Placement Platform</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 flex gap-1">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRoleTab(r.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 font-medium">
            Log in as <strong className="capitalize text-indigo-700">{selectedRole}</strong> demo account.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : `Sign In to ${selectedRole.toUpperCase()} Portal`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Don't have an account? </span>
            <Link to="/register" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
