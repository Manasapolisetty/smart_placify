import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Calendar, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

export const JobCard = ({ job, onApply }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header: Logo, Title, Match Score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <img
              src={job.companyLogo}
              alt={job.companyName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{job.companyName}</p>
            </div>
          </div>

          {job.matchPercentage && (
            <Badge variant="primary" size="md" className="shrink-0 bg-indigo-50 text-indigo-700 font-bold border-indigo-200/80">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>{job.matchPercentage}% Match</span>
            </Badge>
          )}
        </div>

        {/* Info Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-slate-900">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{job.salary}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Apply by {job.applicationDeadline}</span>
          </div>
        </div>

        {/* Required Skills tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skillsRequired?.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60"
            >
              {skill}
            </span>
          ))}
          {job.skillsRequired?.length > 4 && (
            <span className="px-2 py-0.5 text-[11px] font-medium text-slate-400">
              +{job.skillsRequired.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Status & Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Eligible to Apply</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/student/jobs/${job.id}`}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            View Job
          </Link>
          <button
            onClick={() => onApply && onApply(job)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-600/30 flex items-center gap-1 transition-all"
          >
            <span>Apply</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
