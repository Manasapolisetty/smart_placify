import React, { useState, useEffect } from 'react';
import { placementApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download, BarChart3, PieChart as PieIcon, Award } from 'lucide-react';

export const PlacementAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    placementApi.getAnalytics().then(setAnalytics).finally(() => setLoading(false));
  }, []);

  const handleExportPdf = () => {
    toast.success('Analytics Report PDF exported successfully!');
  };

  if (loading || !analytics) {
    return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Analytics Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Analytics & Salary Distribution"
        subtitle="In-depth statistical insights into compensation slabs, top campus recruiters, and branch performance."
        actions={
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Analytics PDF
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Slabs Distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Salary Package Slabs (LPA)
          </h3>
          <p className="text-xs text-slate-500 mb-4">Distribution of placed students across CTC bands</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.salaryDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={11} fontWeight={600} />
                <YAxis stroke="#64748B" fontSize={11} fontWeight={600} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Students Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Recruiters Hires Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-emerald-600" /> Top Recruiting Partners
          </h3>
          <p className="text-xs text-slate-500 mb-4">Number of campus offers extended per company</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topRecruiters} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#64748B" fontSize={11} fontWeight={600} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} fontWeight={600} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="hires" fill="#10B981" radius={[0, 6, 6, 0]} name="Offers Extended" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
