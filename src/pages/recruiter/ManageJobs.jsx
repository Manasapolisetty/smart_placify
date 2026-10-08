import React, { useState, useEffect } from 'react';
import { jobsApi } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Users, Eye, Edit } from 'lucide-react';

export const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    jobsApi.getJobs().then(setJobs).finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      header: 'Job Title & Type',
      accessor: (row) => (
        <div>
          <strong className="block text-slate-900 font-bold text-xs">{row.title}</strong>
          <span className="text-[10px] text-indigo-600 font-semibold">{row.employmentType} • {row.jobType}</span>
        </div>
      )
    },
    { header: 'Location', field: 'location' },
    {
      header: 'Salary Package',
      accessor: (row) => <span className="font-extrabold text-emerald-600">{row.salary}</span>
    },
    {
      header: 'Cutoff CGPA',
      accessor: (row) => <span className="font-bold text-slate-900">{row.minCgpa}</span>
    },
    {
      header: 'Applicants',
      accessor: (row) => (
        <Badge variant="primary" size="md">
          {row.appliedCount || 142} Applied
        </Badge>
      )
    },
    { header: 'Deadline', field: 'applicationDeadline' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/recruiter/jobs/${row.id}`}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </Link>
          <Link
            to="/recruiter/applications"
            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" /> Applicants
          </Link>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Job Openings...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Campus Job Postings"
        subtitle="Active job postings, applicant counts, and recruitment drive settings."
        actions={
          <button
            onClick={() => navigate('/recruiter/jobs/create')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Post New Job Opening
          </button>
        }
      />

      <DataTable columns={columns} data={jobs} searchPlaceholder="Search job openings by title, location..." pageSize={6} />
    </div>
  );
};
