import React from 'react';
import { Calendar, Clock, Video, UserCheck, ExternalLink } from 'lucide-react';
import { Badge } from '../common/Badge';

export const InterviewCard = ({ interview }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <img
            src={interview.companyLogo}
            alt={interview.companyName}
            className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900">{interview.companyName}</h3>
            <p className="text-xs font-semibold text-slate-500">{interview.position}</p>
          </div>
        </div>

        <Badge
          variant={interview.status === 'Completed' ? 'success' : 'primary'}
          size="md"
        >
          {interview.round}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-semibold text-slate-900">{interview.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>{interview.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="w-3.5 h-3.5 text-purple-600" />
          <span>{interview.type}</span>
        </div>
        {interview.interviewerName && (
          <div className="flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{interview.interviewerName}</span>
          </div>
        )}
      </div>

      {interview.instructions && (
        <p className="mt-3 text-xs text-slate-500 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
          <strong className="text-amber-900 font-semibold not-italic">Note: </strong>
          {interview.instructions}
        </p>
      )}

      {interview.meetingLink && (
        <div className="mt-4 flex justify-end">
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Join Meeting</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      )}
    </div>
  );
};
