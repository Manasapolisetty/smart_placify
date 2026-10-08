import React, { useState, useEffect } from 'react';
import { jobsApi, applicationsApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { JobCard } from '../../components/cards/JobCard';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Search, Filter, Sparkles, Send, FileText } from 'lucide-react';

export const FindJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [salaryFilter, setSalaryFilter] = useState('All');
  const [applyModalJob, setApplyModalJob] = useState(null);
  const { toast } = useNotification();

  useEffect(() => {
    jobsApi.getJobs().then((data) => {
      setJobs(data);
      setFilteredJobs(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = jobs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.skillsRequired.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (deptFilter !== 'All') {
      result = result.filter((j) => j.eligibleDepartments.includes(deptFilter));
    }
    if (salaryFilter === 'High') {
      result = result.filter((j) => j.minSalary >= 12.0);
    } else if (salaryFilter === 'Mid') {
      result = result.filter((j) => j.minSalary < 12.0);
    }
    setFilteredJobs(result);
  }, [searchQuery, deptFilter, salaryFilter, jobs]);

  const handleApply = (job) => {
    setApplyModalJob(job);
  };

  const confirmApply = async () => {
    if (!applyModalJob) return;
    try {
      await applicationsApi.applyForJob(applyModalJob.id);
      toast.success(`Application submitted for ${applyModalJob.title} at ${applyModalJob.companyName}!`);
      setApplyModalJob(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.response?.data?.message || err?.message || 'Failed to submit application.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore Placement Opportunities"
        subtitle="Discover verified campus placement drives matching your academic eligibility and technical profile."
      />

      {/* Smart Match Banner matching Stitch */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Smart Match AI Active (92% Highest Match)</h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Based on your CGPA (8.74), CSE department, and React/Node skills.
            </p>
          </div>
        </div>
        <Badge variant="primary" size="lg" className="bg-white/20 text-white border-white/30 font-bold shrink-0">
          {filteredJobs.length} Eligible Positions
        </Badge>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by job title, company name, or skills (React, AWS, Python)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="All">All Branches</option>
            <option value="Computer Science & Engineering">CSE</option>
            <option value="Information Technology">IT</option>
            <option value="Electronics & Communication">ECE</option>
          </select>

          <select
            value={salaryFilter}
            onChange={(e) => setSalaryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="All">All Salary Ranges</option>
            <option value="High">Above ₹12 LPA</option>
            <option value="Mid">Below ₹12 LPA</option>
          </select>
        </div>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-slate-500">Loading placement jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700">No matching jobs found</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} onApply={handleApply} />
          ))}
        </div>
      )}

      {/* Quick Apply Confirmation Modal */}
      <Modal
        isOpen={!!applyModalJob}
        onClose={() => setApplyModalJob(null)}
        title={`Apply to ${applyModalJob?.companyName}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setApplyModalJob(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={confirmApply}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Confirm & Apply Now
            </button>
          </>
        }
      >
        {applyModalJob && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{applyModalJob.title}</h4>
                <p className="text-indigo-700 font-semibold mt-0.5">{applyModalJob.companyName}</p>
              </div>
              <Badge variant="primary">{applyModalJob.matchPercentage}% Match</Badge>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-800">Submit Primary Resume:</h5>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <div>
                    <strong className="block text-slate-900 font-bold">Rahul_Kumar_Resume_2026_V3.pdf</strong>
                    <span className="text-[10px] text-slate-400">ATS Match Score: 92%</span>
                  </div>
                </div>
                <Badge variant="success">Primary</Badge>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium">
              By applying, your academic transcript (CGPA 8.74) and technical profile will be shared with {applyModalJob.companyName} Talent Acquisition.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
