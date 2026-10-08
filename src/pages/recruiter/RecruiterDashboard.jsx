import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { jobsApi, applicationsApi } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Link, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Briefcase, Users, UserCheck, Calendar, Award, Plus, CheckCircle2, XCircle, Eye } from 'lucide-react';

export const RecruiterDashboard = () => {
  const { user } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidateModal, setCandidateModal] = useState(null);

  useEffect(() => {
    Promise.all([jobsApi.getJobs(), applicationsApi.getApplications()]).then(([jData, aData]) => {
      setJobs(jData);
      setApplications(aData);
      setLoading(false);
    });
  }, []);

  const handleShortlist = async (appId) => {
    await applicationsApi.updateStatus(appId, 'Shortlisted');
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: 'Shortlisted' } : a)));
    toast.success('Candidate shortlisted for next round!');
  };

  const handleReject = async (appId) => {
    await applicationsApi.updateStatus(appId, 'Rejected');
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: 'Rejected' } : a)));
    toast.warning('Candidate application rejected.');
  };

  const candidateColumns = [
    {
      header: 'Candidate Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            alt={row.studentName}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div>
            <strong className="block text-slate-900 font-bold">{row.studentName}</strong>
            <span className="text-[10px] text-slate-500">{row.studentEmail}</span>
          </div>
        </div>
      )
    },
    { header: 'Department', field: 'studentDepartment' },
    {
      header: 'CGPA',
      accessor: (row) => <span className="font-bold text-indigo-600">{row.studentCgpa}</span>
    },
    {
      header: 'Match Score',
      accessor: (row) => <Badge variant="primary">{row.matchScore}% Match</Badge>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'Shortlisted'
              ? 'purple'
              : row.status === 'Interview'
              ? 'primary'
              : row.status === 'Rejected'
              ? 'danger'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCandidateModal(row)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
            title="View Profile"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleShortlist(row.id)}
            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold"
            title="Shortlist Candidate"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleReject(row.id)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
            title="Reject Candidate"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const chartData = [
    { job: 'Software Engineer', applicants: 142, shortlisted: 35 },
    { job: 'Associate Cloud Engg', applicants: 98, shortlisted: 18 },
    { job: 'SDE-1 TCS', applicants: 380, shortlisted: 85 },
    { job: 'Data Analyst Deloitte', applicants: 210, shortlisted: 42 },
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Recruiter Dashboard...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Hiring Dashboard"
        subtitle="Manage active job postings, candidate pipelines, applicant screening, and interview schedules."
        actions={
          <button
            onClick={() => navigate('/recruiter/jobs/create')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Post New Job Opening
          </button>
        }
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard title="Active Job Openings" value={jobs.length} icon={Briefcase} color="indigo" />
        <StatCard title="Total Applications" value={applications.length} icon={Users} color="sky" />
        <StatCard
          title="Shortlisted Candidates"
          value={applications.filter(a => a.status === 'Shortlisted' || a.rawStatus === 'SHORTLISTED').length}
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Interviews Scheduled"
          value={applications.filter(a => a.status === 'Interview' || a.rawStatus === 'INTERVIEW').length}
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Final Selections"
          value={applications.filter(a => a.status === 'Selected' || a.rawStatus === 'SELECTED').length}
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Recruitment Funnel Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Applications by Job Posting</h3>
            <p className="text-xs text-slate-500 mt-0.5">Applicant breakdown vs shortlisted candidates</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="job" stroke="#64748B" fontSize={11} fontWeight={600} />
              <YAxis stroke="#64748B" fontSize={11} fontWeight={600} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="applicants" fill="#6366F1" radius={[6, 6, 0, 0]} name="Total Applicants" />
              <Bar dataKey="shortlisted" fill="#10B981" radius={[6, 6, 0, 0]} name="Shortlisted" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidate Applications Management Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Recent Candidate Submissions</h3>
          <Link to="/recruiter/applications" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All Applications →
          </Link>
        </div>

        <DataTable columns={candidateColumns} data={applications} pageSize={5} />
      </div>

      {/* Candidate Profile Preview Modal */}
      <Modal
        isOpen={!!candidateModal}
        onClose={() => setCandidateModal(null)}
        title={candidateModal ? `Candidate Profile: ${candidateModal.studentName}` : ''}
        size="lg"
      >
        {candidateModal && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{candidateModal.studentName}</h4>
                <p className="text-slate-500 mt-0.5">{candidateModal.studentDepartment} • CGPA {candidateModal.studentCgpa}</p>
              </div>
              <Badge variant="primary" size="lg">{candidateModal.matchScore}% Match Score</Badge>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
              <h5 className="font-bold text-slate-900">Verified Credentials:</h5>
              <ul className="space-y-1 text-slate-600">
                <li>• Degree: B.Tech Computer Science & Engineering (2022-2026)</li>
                <li>• Primary Skills: React.js, Node.js, PostgreSQL, AWS Fundamentals</li>
                <li>• Resume ATS Score: 92%</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  handleReject(candidateModal.id);
                  setCandidateModal(null);
                }}
                className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-xl"
              >
                Reject Application
              </button>
              <button
                onClick={() => {
                  handleShortlist(candidateModal.id);
                  setCandidateModal(null);
                }}
                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs"
              >
                Shortlist Candidate
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
