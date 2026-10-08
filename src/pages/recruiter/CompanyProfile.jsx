import React, { useState, useEffect } from 'react';
import { recruiterApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Building2, Globe, MapPin, Users, Award, Edit2, Save, ExternalLink } from 'lucide-react';

export const CompanyProfile = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    website: '',
    industry: '',
    size: '',
    description: '',
  });

  useEffect(() => {
    recruiterApi.getCompanyProfile().then((data) => {
      setCompany(data);
      setFormData({
        name: data.name || '',
        category: data.category || '',
        location: data.location || '',
        website: data.website || '',
        industry: data.industry || data.category || '',
        size: data.size || '',
        description: data.description || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updated = await recruiterApi.updateCompanyProfile(company?.id, formData);
      setCompany(updated);
      setIsEditing(false);
      toast.success('Company profile updated successfully!');
    } catch {
      toast.error('Failed to update company profile.');
    }
  };

  if (loading || !company) {
    return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Company Profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Company Profile & Corporate Branding"
        subtitle="Manage your enterprise profile visible to students during placement drives."
        actions={
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> {isEditing ? 'Cancel Editing' : 'Edit Company Info'}
          </button>
        }
      />

      {/* Main Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={company.logo}
              alt={company.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600/20 shadow-sm shrink-0"
            />
            <div>
              <h2 className="text-xl font-black text-slate-900">{company.name}</h2>
              <p className="text-xs font-semibold text-indigo-600 mt-0.5">{company.category}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> {company.size}
                </span>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center w-full md:w-auto">
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Jobs</span>
              <strong className="text-xl font-black text-indigo-600">{company.activeJobsCount}</strong>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Students Hired</span>
              <strong className="text-xl font-black text-emerald-600">{company.totalHired}</strong>
            </div>
          </div>
        </div>

        {/* Overview & Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Industry & Domain</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description Overview</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </form>
        ) : (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">About Company</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{company.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};
