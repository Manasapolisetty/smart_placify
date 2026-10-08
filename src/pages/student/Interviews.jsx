import React, { useState, useEffect } from 'react';
import { interviewsApi } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { InterviewCard } from '../../components/cards/InterviewCard';
import { Calendar, Video, CheckCircle2, Clock } from 'lucide-react';

export const StudentInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');

  useEffect(() => {
    interviewsApi.getInterviews().then(setInterviews).finally(() => setLoading(false));
  }, []);

  const filtered = interviews.filter((i) =>
    activeTab === 'Upcoming' ? i.status === 'Upcoming' : i.status === 'Completed'
  );

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Interview Schedule...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Interview Schedule"
        subtitle="Manage upcoming technical rounds, virtual meeting links, and recruiter interview feedback."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('Upcoming')}
          className={`pb-3 text-xs font-extrabold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'Upcoming'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" /> Upcoming Interviews ({interviews.filter((i) => i.status === 'Upcoming').length})
        </button>

        <button
          onClick={() => setActiveTab('Completed')}
          className={`pb-3 text-xs font-extrabold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'Completed'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Completed Rounds ({interviews.filter((i) => i.status === 'Completed').length})
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-500">
          No {activeTab.toLowerCase()} interviews scheduled right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <InterviewCard key={item.id} interview={item} />
          ))}
        </div>
      )}
    </div>
  );
};
