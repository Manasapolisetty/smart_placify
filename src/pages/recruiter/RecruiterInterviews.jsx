import React, { useState, useEffect } from 'react';
import { interviewsApi } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { InterviewCard } from '../../components/cards/InterviewCard';
import { Calendar, Plus } from 'lucide-react';

export const RecruiterInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewsApi.getInterviews().then(setInterviews).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Recruiter Interviews...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Candidate Interviews"
        subtitle="Manage upcoming technical interview slots, virtual meeting room links, and candidate evaluations."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {interviews.map((item) => (
          <InterviewCard key={item.id} interview={item} />
        ))}
      </div>
    </div>
  );
};
