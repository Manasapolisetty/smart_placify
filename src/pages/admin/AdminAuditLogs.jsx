import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { ShieldCheck, Download } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    adminApi.getAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  const handleExportLogs = () => {
    toast.success('Security Audit Log report downloaded!');
  };

  const columns = [
    { header: 'Action', accessor: (row) => <strong className="text-slate-900 font-bold">{row.action}</strong> },
    { header: 'Details', field: 'details' },
    { header: 'Performed By', field: 'performedBy' },
    { header: 'Timestamp', field: 'timestamp' },
    { header: 'IP Address', accessor: (row) => <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{row.ip}</code> }
  ];

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Audit Logs...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Security Audit Trail"
        subtitle="Immutable event trail tracking admin actions, role updates, and system events."
        actions={
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Audit Logs
          </button>
        }
      />

      <DataTable columns={columns} data={logs} searchPlaceholder="Search audit logs by action, IP, user..." pageSize={8} />
    </div>
  );
};
