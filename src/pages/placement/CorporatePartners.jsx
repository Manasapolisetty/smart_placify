import React, { useState, useEffect } from 'react';
import { placementApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Building2, Globe, MapPin, Plus, ExternalLink } from 'lucide-react';

export const CorporatePartners = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    placementApi.getCompaniesList().then(setCompanies).finally(() => setLoading(false));
  }, []);

  const handleAddCompany = () => {
    toast.success('Onboarding invite sent to new corporate partner!');
  };

  const columns = [
    {
      header: 'Company Name & Industry',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.logo} alt={row.name} className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0" />
          <div>
            <strong className="block text-slate-900 font-bold">{row.name}</strong>
            <span className="text-[11px] text-indigo-600 font-semibold">{row.category}</span>
          </div>
        </div>
      )
    },
    { header: 'Location', field: 'location' },
    { header: 'Company Size', field: 'size' },
    {
      header: 'Active Job Openings',
      accessor: (row) => <Badge variant="primary">{row.activeJobsCount} Active Jobs</Badge>
    },
    {
      header: 'Total Students Hired',
      accessor: (row) => <strong className="text-emerald-600 font-extrabold">{row.totalHired} Hired</strong>,
      sortable: true
    },
    {
      header: 'Website',
      accessor: (row) => (
        <a href={row.website} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold flex items-center gap-1 hover:underline text-xs">
          Visit Site <ExternalLink className="w-3 h-3" />
        </a>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Corporate Partners...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Recruiting Partners"
        subtitle="Manage campus recruiting companies, job listings, and placement partnership agreements."
        actions={
          <button
            onClick={handleAddCompany}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Onboard Corporate Partner
          </button>
        }
      />

      <DataTable columns={columns} data={companies} searchPlaceholder="Search companies by name, industry, location..." pageSize={8} />
    </div>
  );
};
