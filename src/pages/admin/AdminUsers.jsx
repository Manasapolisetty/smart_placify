import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Users, UserPlus, ShieldCheck, Edit2, Trash2 } from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editName, setEditName] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const { toast } = useNotification();

  useEffect(() => {
    adminApi.getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleSaveUser = async () => {
    try {
      if (editModal && editRole !== editModal.role) {
        await adminApi.updateUserRole(editModal.id, editRole);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === editModal.id ? { ...u, name: editName, role: editRole } : u))
      );
      toast.success('User updated successfully!');
      setEditModal(null);
    } catch {
      toast.error('Failed to update user.');
    }
  };

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

  const handleDeleteConfirm = async () => {
    try {
      await adminApi.deleteUser(deleteModal.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.id));
      toast.success(`User ${deleteModal.name} deleted.`);
      setDeleteModal(null);
    } catch {
      toast.error('Failed to delete user.');
    }
  };

  const columns = [
    {
      header: 'User Account',
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
      header: 'Assigned Role',
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
              setEditModal(row);
              setEditName(row.name);
              setEditRole(row.role);
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
            title="Edit User"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeactivate(row.id)}
            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold"
            title="Toggle Status"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
            title="Delete User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading User Directory...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise User Directory"
        subtitle="Manage system accounts across Students, Recruiters, Placement Officers, and Administrators."
        actions={
          <button
            onClick={() => toast.success('Add User Form Opened')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add New System User
          </button>
        }
      />

      <DataTable columns={columns} data={users} searchPlaceholder="Search users by name, email, role..." pageSize={8} />

      {/* Edit User Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title={editModal ? `Edit User: ${editModal.name}` : ''} size="sm">
        {editModal && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role</label>
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
              Save Changes
            </button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirm User Deletion" size="sm">
        {deleteModal && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to permanently delete user account <strong>{deleteModal.name}</strong> ({deleteModal.email})?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 border rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl">
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
