import React, { useState, useEffect } from 'react';
import { placementApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Download, GraduationCap, Mail, Phone } from 'lucide-react';

export const PlacementStudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    placementApi.getStudentsList().then(setStudents).finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    toast.success('Student Placement Master Directory exported as CSV!');
  };

  const columns = [
    {
      header: 'Student Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.avatar} alt={row.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
          <div>
            <strong className="block text-slate-900 font-bold">{row.name}</strong>
            <span className="text-[10px] text-slate-500">{row.enrollmentNo}</span>
          </div>
        </div>
      )
    },
    { header: 'Department', field: 'department' },
    {
      header: 'CGPA',
      accessor: (row) => <span className="font-extrabold text-indigo-600">{row.academics?.overallCgpa}</span>,
      sortable: true
    },
    {
      header: 'Placement Status',
      accessor: (row) => (
        <Badge variant={row.placementStatus === 'Placed' ? 'success' : row.placementStatus === 'In Process' ? 'warning' : 'neutral'}>
          {row.placementStatus}
        </Badge>
      )
    },
    {
      header: 'Placed Offer',
      accessor: (row) =>
        row.placedCompany ? (
          <div>
            <strong className="block text-emerald-950 font-bold text-xs">{row.placedCompany}</strong>
            <span className="text-[10px] text-emerald-700 font-semibold">{row.placedPackage}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
    }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Student Directory...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Master Placement Directory"
        subtitle="Comprehensive list of enrolled students, CGPA verification, and active placement statuses."
        actions={
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV Directory
          </button>
        }
      />

      <DataTable columns={columns} data={students} searchPlaceholder="Search student by name, enrollment no, branch..." pageSize={10} />
    </div>
  );
};
