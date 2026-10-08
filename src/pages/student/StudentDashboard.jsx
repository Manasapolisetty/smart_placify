import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { studentApi, jobsApi, applicationsApi, interviewsApi } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { ProgressCircle } from '../../components/common/ProgressCircle';
import { ProgressBar } from '../../components/common/ProgressBar';
import { JobCard } from '../../components/cards/JobCard';
import { InterviewCard } from '../../components/cards/InterviewCard';
import { ApplicationTimeline } from '../../components/common/Timeline';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  GraduationCap,
  Briefcase,
  FileText,
  UserCheck,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useNotification();
  const [profile, setProfile] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [activeApplication, setActiveApplication] = useState(null);
  const [upcomingInterview, setUpcomingInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalJob, setApplyModalJob] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, jobsData, appsData, intData] = await Promise.all([
          studentApi.getProfile(),
          jobsApi.getJobs(),
          applicationsApi.getApplications(),
          interviewsApi.getInterviews()
        ]);
        setProfile(profData);
        setRecommendedJobs(jobsData.slice(0, 2)); // Show top 2 matching jobs
        setActiveApplication(appsData[0]); // Top active application
        setUpcomingInterview(intData.find(i => i.status === 'Upcoming'));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading || !profile) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-bold text-slate-500">Loading Student Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Good Morning, ${profile.name.split(' ')[0]} 👋`}
        subtitle="Here's your placement progress today."
        actions={
          <Badge variant="warning" size="lg" className="px-3 py-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Placement Status: {profile.placementStatus}</span>
          </Badge>
        }
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Profile Completion"
          value={`${profile.profileCompletion}%`}
          subtitle="Keep your profile updated"
          icon={GraduationCap}
          color="indigo"
        />
        <StatCard
          title="Eligible Jobs"
          value={profile.stats.eligibleJobsCount}
          subtitle="Based on CGPA & branch"
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          title="Applications"
          value={profile.stats.totalApplications}
          subtitle="Active job submissions"
          icon={FileText}
          color="sky"
        />
        <StatCard
          title="Shortlisted"
          value={profile.stats.shortlistedCount}
          subtitle="Passed screening"
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Interviews"
          value={profile.stats.interviewsCount}
          subtitle="Scheduled & completed"
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Placement Readiness & Active Application (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Placement Readiness Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Placement Readiness Score
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Comprehensive benchmark based on your performance metrics</p>
              </div>
              <Badge variant="primary" size="md">
                Updated Today
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Circular Readiness Score Gauge */}
              <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-4">
                <ProgressCircle
                  score={profile.placementReadinessScore}
                  maxScore={100}
                  size={140}
                  strokeWidth={10}
                  label="Placement Readiness"
                />
              </div>

              {/* Category Breakdown Bars */}
              <div className="md:col-span-2 space-y-3">
                {profile.readinessBreakdown.map((item, idx) => (
                  <ProgressBar
                    key={idx}
                    label={item.category}
                    score={item.score}
                    maxScore={item.maxScore}
                    color={item.color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Application Progress Timeline Card */}
          {activeApplication && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={activeApplication.companyLogo}
                    alt={activeApplication.companyName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-2xs"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{activeApplication.jobTitle}</h3>
                    <p className="text-xs font-semibold text-slate-500">{activeApplication.companyName}</p>
                  </div>
                </div>
                <Badge variant="primary" size="md">
                  {activeApplication.matchScore}% Match
                </Badge>
              </div>

              {/* Progress Timeline */}
              <ApplicationTimeline
                timeline={activeApplication.timeline}
                currentStatus={activeApplication.status}
              />

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Current Round: <strong className="text-slate-900">{activeApplication.currentRound}</strong></span>
                <span>Next Update: <strong className="text-slate-900">{activeApplication.nextActionDate}</strong></span>
              </div>
            </div>
          )}

          {/* Recommended Jobs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Recommended Jobs For You</h3>
              <a href="/student/jobs" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                View All Jobs <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedJobs.map((job) => (
                <JobCard key={job.id} job={job} onApply={handleApply} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Interview & Quick Actions (1 Col) */}
        <div className="space-y-6">
          {/* Upcoming Interview Card */}
          {upcomingInterview && (
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Upcoming Interview</h3>
              <InterviewCard interview={upcomingInterview} />
            </div>
          )}

          {/* Placement Notice Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
            <h4 className="text-base font-extrabold">Campus Placement Drive Alert</h4>
            <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed">
              Google India & TechCorp Solutions drives are scheduled for next week. Ensure your resume and CGPA proof are uploaded.
            </p>
            <a
              href="/student/academics"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <span>Verify Academic Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Apply Confirmation Modal */}
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
