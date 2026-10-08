import React, { useState, useEffect } from 'react';
import { placementApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, GraduationCap, Building2, Award, Download, TrendingUp, Calendar, Plus, CheckCircle2 } from 'lucide-react';

export const PlacementDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    Promise.all([placementApi.getAnalytics(), placementApi.getDrives()]).then(([aData, dData]) => {
      setAnalytics(aData);
      setDrives(dData);
      setLoading(false);
    });
  }, []);

  const handleExportReport = () => {
    toast.success('Campus Placement Summary Report exported successfully!');
  };

  const driveColumns = [
    {
      header: 'Company & Drive Title',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.logo} alt={row.companyName} className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0" />
          <div>
            <strong className="block text-slate-900 font-bold">{row.title}</strong>
            <span className="text-[11px] text-indigo-600 font-semibold">{row.companyName}</span>
          </div>
        </div>
      )
    },
    { header: 'Drive Date', field: 'driveDate' },
    { header: 'Venue / Mode', field: 'venue' },
    {
      header: 'Package CTC',
      accessor: (row) => <span className="font-extrabold text-emerald-600">{row.packageOffered}</span>
    },
    { header: 'Registered', field: 'registeredStudents' },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'Ongoing' ? 'primary' : 'success'}>{row.status}</Badge>
      )
    }
  ];

  if (loading || !analytics) {
    return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Placement Officer Portal...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & Placement Officer (TPO) Dashboard"
        subtitle="University-wide campus recruitment analytics, company drives, and department placement metrics."
        actions={
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Export TPO Summary Report
          </button>
        }
      />

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard title="Total Students" value={analytics.totalStudents} icon={GraduationCap} color="indigo" />
        <StatCard title="Eligible Batch" value={analytics.eligibleStudents} icon={Users} color="sky" />
        <StatCard title="Placed Students" value={analytics.placedStudents} icon={CheckCircle2} color="emerald" />
        <StatCard title="Placement Rate" value={`${analytics.overallPlacementRate}%`} icon={Award} color="purple" />
        <StatCard title="Average CTC" value={`₹${analytics.averagePackage} LPA`} icon={TrendingUp} color="amber" />
        <StatCard title="Highest CTC" value={`₹${analytics.highestPackage} LPA`} icon={Award} color="rose" />
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Placement % */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Department Placement Rate (%)</h3>
          <p className="text-xs text-slate-500 mb-4">Percentage of eligible students placed per branch</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.departmentWisePlacement} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="department" stroke="#64748B" fontSize={10} fontWeight={600} tickFormatter={(v) => v.split(' ')[0]} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} fontWeight={600} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="percentage" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Placement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Year Placement Trend */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Yearly Average CTC Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Growth in average package (LPA) over 5 years</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.placementTrendYears} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="year" stroke="#64748B" fontSize={11} fontWeight={600} />
                <YAxis domain={[5, 15]} stroke="#64748B" fontSize={11} fontWeight={600} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="avgSalary" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: '#10B981' }} name="Avg Package (LPA)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Placement Drives Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Active Campus Placement Drives
          </h3>
        </div>

        <DataTable columns={driveColumns} data={drives} pageSize={5} />
      </div>
    </div>
  );
};
