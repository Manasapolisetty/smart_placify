import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi, applicationsApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  MapPin,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Building2,
  Send,
  FileText,
  Clock,
  Briefcase,
  ArrowLeft
} from 'lucide-react';

export const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useNotification();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    jobsApi
      .getJobById(id)
      .then(setJob)
      .catch((err) => {
        toast.error('Job not found.');
        navigate('/student/jobs');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const confirmApply = async () => {
    try {
      await applicationsApi.applyForJob(job.id);
      toast.success(`Application submitted for ${job.title} at ${job.companyName}!`);
      setIsApplyModalOpen(false);
      navigate('/student/applications');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.response?.data?.message || err?.message || 'Failed to submit application.'));
    }
  };

  if (loading || !job) {
    return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Job Details...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/student/jobs')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Job Search
      </button>

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={job.companyLogo}
              alt={job.companyName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{job.title}</h1>
                <Badge variant="primary" size="lg" className="font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> {job.matchPercentage}% Match
                </Badge>
              </div>
              <p className="text-xs font-bold text-indigo-600 mt-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {job.companyName} • {job.jobType}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Send className="w-4 h-4" /> Apply for Position
          </button>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Salary Package</span>
            <strong className="text-slate-900 text-sm">{job.salary}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
            <strong className="text-slate-900 text-xs">{job.location}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Application Deadline</span>
            <strong className="text-slate-900 text-xs">{job.applicationDeadline}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Openings</span>
            <strong className="text-indigo-600 text-sm">{job.openings} Openings</strong>
          </div>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Overview & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Briefcase className="w-5 h-5 text-indigo-600" /> Job Overview & Context
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{job.overview}</p>

            <h4 className="text-xs font-bold text-slate-900 pt-2">Key Responsibilities:</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {job.responsibilities?.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>

            <h4 className="text-xs font-bold text-slate-900 pt-2">Required Skills & Technologies:</h4>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired?.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Selection Process Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600" /> Recruitment Selection Process
            </h3>

            <div className="space-y-3">
              {job.selectionProcess?.map((step) => (
                <div key={step.step} className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Duration: {step.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Eligibility Checker Widget matching Stitch */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Eligibility Verification</h3>
              <Badge variant="success" size="md">
                Verified
              </Badge>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5 stroke-[3]" />
              </div>
              <h4 className="text-xs font-bold text-emerald-950">You Are Eligible For This Job</h4>
              <p className="text-[11px] text-emerald-800">Your profile meets all recruiter criteria.</p>
            </div>

            <div className="space-y-2.5">
              {job.eligibilityBreakdown?.map((rule, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rule.satisfied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{rule.rule}</h5>
                      <span className="text-[10px] text-slate-500">Your Value: {rule.studentValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all mt-4"
            >
              <Send className="w-4 h-4" /> Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply to ${job.companyName}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={confirmApply}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Submit Application
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-slate-900 text-sm">{job.title}</h4>
            <p className="text-indigo-700 font-semibold mt-0.5">{job.companyName}</p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-800">Primary Resume:</h5>
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
        </div>
      </Modal>
    </div>
  );
};
