import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GraduationCap, Award, BookOpen, Download, CheckCircle2, TrendingUp } from 'lucide-react';

export const AcademicRecords = () => {
  const [academics, setAcademics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    studentApi.getAcademics().then(setAcademics).finally(() => setLoading(false));
  }, []);

  const handleDownloadReport = () => {
    toast.success('Official Academic Transcript PDF downloaded successfully!');
  };

  if (loading || !academics) {
    return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Academic Records...</div>;
  }

  const semesterColumns = [
    { header: 'Semester', accessor: (row) => <strong className="text-slate-900 font-bold">Sem {row.sem}</strong> },
    { header: 'Academic Term / Year', field: 'year' },
    {
      header: 'SGPA',
      accessor: (row) => <span className="text-indigo-600 font-extrabold text-sm">{row.sgpa}</span>,
      sortable: true
    },
    { header: 'Total Credits', field: 'totalCredits' },
    {
      header: 'Status',
      accessor: (row) => <Badge variant={row.status === 'Passed' ? 'success' : 'danger'}>{row.status}</Badge>
    },
    { header: 'Active Backlogs', field: 'backlogs' }
  ];

  const subjectColumns = [
    { header: 'Code', accessor: (row) => <code className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded">{row.code}</code> },
    { header: 'Subject Name', accessor: (row) => <span className="font-bold text-slate-900">{row.name}</span> },
    { header: 'Credits', field: 'credits' },
    {
      header: 'Grade',
      accessor: (row) => (
        <Badge variant={row.grade.includes('+') || row.grade === 'O' ? 'success' : 'primary'}>
          {row.grade}
        </Badge>
      )
    },
    {
      header: 'Marks %',
      accessor: (row) => <strong className="text-slate-900">{row.marks}%</strong>
    },
    {
      header: 'Status',
      accessor: (row) => <Badge variant="success">{row.status}</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Records & Transcripts"
        subtitle="Official semester-wise grade breakdown and cumulative academic performance metrics."
        actions={
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Academic Report
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Cumulative CGPA"
          value={academics.overallCgpa}
          subtitle="Out of 10.0 scale"
          icon={GraduationCap}
          color="indigo"
          trend="up"
          trendValue="+0.12 Sem-over-Sem"
        />
        <StatCard
          title="Current SGPA"
          value={academics.currentSgpa}
          subtitle="Semester 6 result"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Active Backlogs"
          value={academics.activeBacklogs}
          subtitle="Clean record"
          icon={CheckCircle2}
          color="sky"
        />
        <StatCard
          title="Overall Attendance"
          value={`${academics.attendancePercentage}%`}
          subtitle="Meets 75% threshold"
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* SGPA Progression Chart matching Stitch */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> SGPA Trend Progression
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Semester 1 to Semester 6 performance arc</p>
          </div>
          <Badge variant="primary">Consistent Growth</Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={academics.sgpaHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="semester" stroke="#64748B" fontSize={11} fontWeight={600} />
              <YAxis domain={[7.5, 10]} stroke="#64748B" fontSize={11} fontWeight={600} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val) => [`${val} SGPA`, 'Performance']}
              />
              <Line
                type="monotone"
                dataKey="sgpa"
                stroke="#4F46E5"
                strokeWidth={3}
                dot={{ r: 5, fill: '#4F46E5', strokeWidth: 2, stroke: '#FFF' }}
                activeDot={{ r: 8, fill: '#6366F1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Semester Breakdown Table */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Semester Grade Card Summary
        </h3>
        <DataTable columns={semesterColumns} data={academics.semesters} pageSize={6} />
      </div>

      {/* Subject Performance Table */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" /> Current Semester Subject Grades (Sem 6)
        </h3>
        <DataTable columns={subjectColumns} data={academics.subjectPerformance} pageSize={6} />
      </div>
    </div>
  );
};
