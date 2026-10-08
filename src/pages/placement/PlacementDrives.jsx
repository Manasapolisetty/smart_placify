import React, { useState, useEffect } from 'react';
import { placementApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Calendar, Plus, MapPin, Users, Award, Eye } from 'lucide-react';

export const PlacementDrives = () => {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDrive, setNewDrive] = useState({
    title: '',
    companyId: '',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    venue: 'Campus Main Auditorium',
    description: 'Annual campus placement and recruitment drive',
    eligibilityCriteria: 'Minimum CGPA >= 7.50, 0 Active Backlogs',
  });
  const { toast } = useNotification();

  useEffect(() => {
    Promise.all([
      placementApi.getDrives(),
      placementApi.getCompaniesList().catch(() => []),
    ])
      .then(([dData, cData]) => {
        setDrives(dData);
        setCompanies(cData);
        if (cData.length > 0) {
          setNewDrive((prev) => ({ ...prev, companyId: cData[0].id }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newDrive.title) return;
    setSubmitting(true);
    try {
      await placementApi.createDrive({
        ...newDrive,
        companyId: newDrive.companyId || (companies[0]?.id || '11111111-1111-1111-1111-111111111111'),
      });
      const updatedDrives = await placementApi.getDrives();
      setDrives(updatedDrives);
      setIsCreateModalOpen(false);
      setNewDrive({
        title: '',
        companyId: companies[0]?.id || '',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        venue: 'Campus Main Auditorium',
        description: 'Annual campus placement and recruitment drive',
        eligibilityCriteria: 'Minimum CGPA >= 7.50, 0 Active Backlogs',
      });
      toast.success('New campus placement drive scheduled and saved to database!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create placement drive.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Drive Title & Company',
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
    { header: 'Venue', field: 'venue' },
    {
      header: 'CTC Package',
      accessor: (row) => <span className="font-extrabold text-emerald-600">{row.packageOffered}</span>
    },
    { header: 'Registered Students', field: 'registeredStudents' },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'Ongoing' ? 'primary' : 'success'}>{row.status}</Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => setSelectedDrive(row)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Placement Drives...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Placement Drive Management"
        subtitle="Schedule placement drives, track venue allocations, eligible branches, and student registrations."
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule New Placement Drive
          </button>
        }
      />

      <DataTable columns={columns} data={drives} searchPlaceholder="Search drives by company, venue, title..." pageSize={6} />

      {/* Schedule Drive Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule New Placement Drive"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Drive Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Campus Placement Drive 2026"
              value={newDrive.title}
              onChange={(e) => setNewDrive({ ...newDrive, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Recruiting Company</label>
            <select
              value={newDrive.companyId}
              onChange={(e) => setNewDrive({ ...newDrive, companyId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Drive Start Date</label>
              <input
                type="date"
                required
                value={newDrive.startDate}
                onChange={(e) => setNewDrive({ ...newDrive, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Mode</label>
              <input
                type="text"
                placeholder="Auditorium / Virtual"
                value={newDrive.venue}
                onChange={(e) => setNewDrive({ ...newDrive, venue: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Eligibility Criteria</label>
            <input
              type="text"
              value={newDrive.eligibilityCriteria}
              onChange={(e) => setNewDrive({ ...newDrive, eligibilityCriteria: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={newDrive.description}
              onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule Drive'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Drive Details Modal */}
      <Modal
        isOpen={!!selectedDrive}
        onClose={() => setSelectedDrive(null)}
        title={selectedDrive ? `Placement Drive: ${selectedDrive.companyName}` : ''}
        size="md"
      >
        {selectedDrive && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
              <h4 className="font-extrabold text-slate-900 text-sm">{selectedDrive.title}</h4>
              <p className="text-indigo-700 font-bold">{selectedDrive.companyName} • Package {selectedDrive.packageOffered}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Drive Date</span>
                <strong className="text-slate-900">{selectedDrive.driveDate}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Venue / Mode</span>
                <strong className="text-slate-900">{selectedDrive.venue}</strong>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-1">Eligible Branches:</h5>
              <div className="flex flex-wrap gap-1.5">
                {selectedDrive.eligibleBranches?.map((b, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-1">Selection Rounds:</h5>
              <ul className="space-y-1 text-slate-600">
                {selectedDrive.rounds?.map((r, idx) => (
                  <li key={idx}>• Round {idx + 1}: {r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
