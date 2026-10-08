import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { FileText, Download, Printer, CheckCircle2 } from 'lucide-react';

export const PlacementReports = () => {
  const { toast } = useNotification();

  const reports = [
    { title: 'Annual Placement Summary Report 2025-2026', format: 'PDF Document', size: '2.4 MB', date: '06 Oct 2025' },
    { title: 'Department-wise Placement Audit & Salary Slabs', format: 'Excel Workbook (.xlsx)', size: '1.8 MB', date: '04 Oct 2025' },
    { title: 'Corporate Recruiter Hiring Master Sheet', format: 'PDF Document', size: '3.1 MB', date: '01 Oct 2025' },
    { title: 'Student Eligibility & Backlog Verification Report', format: 'CSV Export', size: '850 KB', date: '28 Sep 2025' },
  ];

  const handleDownload = (name) => {
    toast.success(`Downloaded: ${name}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Placement Reports & Institutional Audits" subtitle="Generate, preview, and download official university placement reports." />

      <div className="grid grid-cols-1 gap-4">
        {reports.map((rep, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{rep.format} • {rep.size} • Generated {rep.date}</p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(rep.title)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
