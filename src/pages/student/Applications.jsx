import React, { useState, useEffect } from 'react';
import { applicationsApi } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { ApplicationTimeline } from '../../components/common/Timeline';
import { Modal } from '../../components/common/Modal';
import { FileCheck, Clock, CheckCircle2, UserCheck, Sparkles, Eye } from 'lucide-react';

export const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    applicationsApi.getApplications().then(setApplications).finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Shortlisted': return <Badge variant="purple">Shortlisted</Badge>;
      case 'Interview': return <Badge variant="primary">Interview Scheduled</Badge>;
      case 'Selected': return <Badge variant="success">Selected / Offer</Badge>;
      case 'Screening': return <Badge variant="warning">Under Review</Badge>;
      case 'Applied': return <Badge variant="info">Applied</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns = [
    {
      header: 'Company & Position',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.companyLogo} alt={row.companyName} className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0" />
          <div>
            <strong className="block text-slate-900 font-bold">{row.jobTitle}</strong>
            <span className="text-[11px] text-slate-500 font-semibold">{row.companyName}</span>
          </div>
        </div>
      )
    },
    { header: 'Applied Date', field: 'appliedDate' },
    {
      header: 'Match Score',
      accessor: (row) => (
        <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-xs">
          {row.matchScore}% Match
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => getStatusBadge(row.status)
    },
    { header: 'Current Round', field: 'currentRound' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => setSelectedApp(row)}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View Timeline
        </button>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Applications...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Job Applications"
        subtitle="Track application statuses, active interview rounds, and selection updates."
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard title="Total Applied" value={applications.length} icon={FileCheck} color="indigo" />
        <StatCard
          title="Under Review"
          value={applications.filter(a => ['Applied', 'Screening'].includes(a.status) || a.rawStatus === 'APPLIED').length}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Shortlisted"
          value={applications.filter(a => a.status === 'Shortlisted' || a.rawStatus === 'SHORTLISTED').length}
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title="Interviews"
          value={applications.filter(a => a.status === 'Interview' || a.rawStatus === 'INTERVIEW').length}
          icon={UserCheck}
          color="amber"
        />
        <StatCard
          title="Selected"
          value={applications.filter(a => a.status === 'Selected' || a.rawStatus === 'SELECTED').length}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Applications Data Table */}
      <DataTable columns={columns} data={applications} searchPlaceholder="Search applications..." pageSize={6} />

      {/* Application Timeline Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={selectedApp ? `Application Progress: ${selectedApp.companyName}` : ''}
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{selectedApp.jobTitle}</h4>
                <p className="text-xs text-indigo-600 font-bold mt-0.5">{selectedApp.companyName}</p>
              </div>
              {getStatusBadge(selectedApp.status)}
            </div>

            {/* Pipeline Timeline */}
            <ApplicationTimeline timeline={selectedApp.timeline} currentStatus={selectedApp.status} />

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <strong>Recruiter Notes & Next Step:</strong>
              <p>{selectedApp.notes}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
