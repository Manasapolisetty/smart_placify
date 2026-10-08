import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { BookOpen, Plus, Users, GraduationCap } from 'lucide-react';

export const AdminDepartments = () => {
  const { toast } = useNotification();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDepartments().then(setDepartments).finally(() => setLoading(false));
  }, []);

  const handleAddDept = () => {
    toast.success('Department creation form opened');
  };

  const columns = [
    { header: 'Branch Code', accessor: (row) => <code className="bg-slate-100 font-bold px-1.5 py-0.5 rounded text-indigo-600">{row.code}</code> },
    { header: 'Department Name', accessor: (row) => <strong className="text-slate-900 font-bold">{row.name}</strong> },
    { header: 'Department Head (HOD)', field: 'head' },
    { header: 'Enrolled Students', field: 'studentsCount', sortable: true },
    { header: 'Courses Count', field: 'coursesCount' },
    { header: 'Status', accessor: (row) => <Badge variant="success">{row.status}</Badge> }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Academic Departments...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="University Department & Course Administration"
        subtitle="Manage academic departments, branch codes, department heads, and course offerings."
        actions={
          <button
            onClick={handleAddDept}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        }
      />

      <DataTable columns={columns} data={departments} searchPlaceholder="Search department by name or code..." pageSize={5} />
    </div>
  );
};
