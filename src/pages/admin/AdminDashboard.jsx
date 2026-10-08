import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Users, GraduationCap, Building2, Briefcase, ShieldCheck, Settings, Eye, Trash2, Edit2 } from 'lucide-react';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUserModal, setEditUserModal] = useState(null);
  const [editRole, setEditRole] = useState('');
  const { toast } = useNotification();

  useEffect(() => {
    Promise.all([adminApi.getUsers(), adminApi.getAuditLogs()]).then(([uData, aLogs]) => {
      setUsers(uData);
      setAuditLogs(aLogs);
      setLoading(false);
    });
  }, []);

  const handleDeactivate = async (userId) => {
    try {
      const updated = await adminApi.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: updated?.status || (u.status === 'Active' ? 'Inactive' : 'Active') } : u
        )
      );
      toast.info('User status updated successfully.');
    } catch {
      toast.error('Failed to update user status.');
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editUserModal && editRole !== editUserModal.role) {
        await adminApi.updateUserRole(editUserModal.id, editRole);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === editUserModal.id ? { ...u, role: editRole } : u))
      );
      toast.success('User updated successfully!');
      setEditUserModal(null);
    } catch {
      toast.error('Failed to update user.');
    }
  };

  const userColumns = [
    {
      header: 'User Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
          <div>
            <strong className="block text-slate-900 font-bold">{row.name}</strong>
            <span className="text-[10px] text-slate-500">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: (row) => (
        <Badge
          variant={
            row.role === 'student'
              ? 'primary'
              : row.role === 'recruiter'
              ? 'purple'
              : row.role === 'placement'
              ? 'success'
              : 'warning'
          }
        >
          {row.role.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: (row) => <Badge variant={row.status === 'Active' ? 'success' : 'danger'}>{row.status}</Badge>
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditUserModal(row);
              setEditRole(row.role);
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
            title="Edit User"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeactivate(row.id)}
            className={`p-1.5 rounded-lg text-xs font-bold ${
              row.status === 'Active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title="Toggle Status"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const auditColumns = [
    { header: 'Action', accessor: (row) => <strong className="text-slate-900 font-bold">{row.action}</strong> },
    { header: 'Details', field: 'details' },
    { header: 'Performed By', field: 'performedBy' },
    { header: 'Timestamp', field: 'timestamp' },
    { header: 'IP Address', accessor: (row) => <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{row.ip}</code> }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Enterprise Admin Portal...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Administration Portal"
        subtitle="User directory management, role access controls, department configurations, and system audit logs."
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard title="Total Platform Users" value={users.length} icon={Users} color="indigo" />
        <StatCard title="Active Students" value={users.filter(u => u.role === 'student' || u.role === 'STUDENT').length} icon={GraduationCap} color="sky" />
        <StatCard title="Corporate Recruiters" value={users.filter(u => u.role === 'recruiter' || u.role === 'RECRUITER').length} icon={Building2} color="purple" />
        <StatCard title="Placement Officers" value={users.filter(u => u.role === 'placement' || u.role === 'PLACEMENT_OFFICER').length} icon={Briefcase} color="amber" />
        <StatCard title="Audit Security Logs" value={auditLogs.length} icon={ShieldCheck} color="emerald" />
      </div>

      {/* User Directory Table */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-slate-900">Platform User Directory</h3>
        <DataTable columns={userColumns} data={users} pageSize={5} />
      </div>

      {/* System Audit Logs Table */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Security Audit Trail
        </h3>
        <DataTable columns={auditColumns} data={auditLogs} pageSize={4} />
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editUserModal}
        onClose={() => setEditUserModal(null)}
        title={editUserModal ? `Edit User: ${editUserModal.name}` : ''}
        size="sm"
      >
        {editUserModal && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">User Full Name</label>
              <input type="text" defaultValue={editUserModal.name} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold" />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input type="email" defaultValue={editUserModal.email} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold" />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
              >
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
                <option value="placement">Placement Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              onClick={handleSaveUser}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              Save User Changes
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
