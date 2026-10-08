import React, { useState, useEffect } from 'react';
import { applicationsApi, interviewsApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CheckCircle2, XCircle, Calendar, Eye, Send } from 'lucide-react';

export const RecruiterApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    round: 'Technical Round 2',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '11:00 AM',
    link: 'https://meet.google.com/xyz-abc'
  });
  const { toast } = useNotification();

  useEffect(() => {
    applicationsApi.getApplications().then(setApplications).finally(() => setLoading(false));
  }, []);

  const handleShortlist = async (appId) => {
    try {
      await applicationsApi.updateStatus(appId, 'Shortlisted');
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: 'Shortlisted' } : a)));
      toast.success('Candidate shortlisted for next round!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.response?.data?.message || 'Failed to shortlist candidate.'));
    }
  };

  const handleReject = async (appId) => {
    try {
      await applicationsApi.updateStatus(appId, 'Rejected');
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: 'Rejected' } : a)));
      toast.warning('Candidate application rejected.');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.response?.data?.message || 'Failed to reject candidate.'));
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await interviewsApi.scheduleInterview({
        applicationId: scheduleModal.id,
        companyName: scheduleModal.companyName,
        companyLogo: scheduleModal.companyLogo,
        position: scheduleModal.jobTitle,
        round: interviewForm.round,
        date: interviewForm.date,
        time: interviewForm.time,
        type: 'Virtual Meeting',
        meetingLink: interviewForm.link,
        studentId: scheduleModal.studentId,
        studentName: scheduleModal.studentName
      });
      await applicationsApi.updateStatus(scheduleModal.id, 'Interview');
      setApplications((prev) => prev.map((a) => (a.id === scheduleModal.id ? { ...a, status: 'Interview' } : a)));
      toast.success(`Interview scheduled with ${scheduleModal.studentName}!`);
      setScheduleModal(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.response?.data?.message || 'Failed to schedule interview.'));
    }
  };

  const columns = [
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
    { header: 'Position Applied', field: 'jobTitle' },
    { header: 'Department', field: 'studentDepartment' },
    {
      header: 'CGPA',
      accessor: (row) => <span className="font-extrabold text-indigo-600">{row.studentCgpa}</span>,
      sortable: true
    },
    {
      header: 'Match Score',
      accessor: (row) => <Badge variant="primary">{row.matchScore}% Match</Badge>,
      sortable: true
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
            onClick={() => setSelectedCandidate(row)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
            title="View Candidate Profile"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleShortlist(row.id)}
            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold"
            title="Shortlist"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScheduleModal(row)}
            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold"
            title="Schedule Interview"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleReject(row.id)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
            title="Reject"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Candidate Applications...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Application Pipeline"
        subtitle="Review student applications, inspect verified academic metrics, shortlist top candidates, and schedule interviews."
      />

      <DataTable columns={columns} data={applications} searchPlaceholder="Search by student name, department, status..." pageSize={8} />

      {/* Candidate Profile Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate ? `Candidate: ${selectedCandidate.studentName}` : ''}
        size="lg"
      >
        {selectedCandidate && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{selectedCandidate.studentName}</h4>
                <p className="text-slate-500 mt-0.5">{selectedCandidate.studentDepartment} • CGPA {selectedCandidate.studentCgpa}</p>
              </div>
              <Badge variant="primary" size="lg">{selectedCandidate.matchScore}% Match Score</Badge>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
              <h5 className="font-bold text-slate-900">Academic & Skill Highlights:</h5>
              <ul className="space-y-1 text-slate-600">
                <li>• Degree: B.Tech Computer Science & Engineering (Batch 2026)</li>
                <li>• Technical Skills: React.js, Node.js, PostgreSQL, AWS Cloud</li>
                <li>• Resume ATS Compatibility: 92%</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={!!scheduleModal}
        onClose={() => setScheduleModal(null)}
        title={scheduleModal ? `Schedule Interview with ${scheduleModal.studentName}` : ''}
        size="md"
      >
        {scheduleModal && (
          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Interview Round Title</label>
              <input
                type="text"
                required
                value={interviewForm.round}
                onChange={(e) => setInterviewForm({ ...interviewForm, round: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="text"
                  required
                  value={interviewForm.date}
                  onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time</label>
                <input
                  type="text"
                  required
                  value={interviewForm.time}
                  onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Virtual Meeting Link</label>
              <input
                type="text"
                required
                value={interviewForm.link}
                onChange={(e) => setInterviewForm({ ...interviewForm, link: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5">
              <Send className="w-4 h-4" /> Confirm & Schedule Interview
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
