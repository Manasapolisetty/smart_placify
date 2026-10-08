import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ProgressBar } from '../../components/common/ProgressBar';
import {
  User,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Plus,
  Edit2,
  CheckCircle2,
  Download,
  Eye,
  Trash2,
  Sparkles
} from 'lucide-react';

export const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  // Modals state
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumePreviewModal, setResumePreviewModal] = useState(false);
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);

  // Form states
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', rating: 80, category: 'Frontend' });
  const [newProject, setNewProject] = useState({ title: '', description: '', duration: '', role: '', technologies: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', issueDate: '', credentialId: '' });
  const [newResume, setNewResume] = useState({ name: '', fileUrl: '' });

  useEffect(() => {
    studentApi.getProfile().then(setProfile).finally(() => setLoading(false));
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name) return;
    try {
      await studentApi.addSkill(newSkill);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      setIsSkillModalOpen(false);
      setNewSkill({ name: '', level: 'Intermediate', rating: 80, category: 'Frontend' });
      toast.success(`Added skill: ${newSkill.name}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add skill.');
    }
  };

  const handleDeleteSkill = async (skillId, skillName) => {
    try {
      await studentApi.deleteSkill(skillId);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      toast.success(`Removed skill: ${skillName}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete skill.');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title) return;
    try {
      await studentApi.addProject(newProject);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      setIsProjectModalOpen(false);
      setNewProject({ title: '', description: '', duration: '', role: '', technologies: '' });
      toast.success(`Added project: ${newProject.title}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add project.');
    }
  };

  const handleDeleteProject = async (projId, projTitle) => {
    try {
      await studentApi.deleteProject(projId);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      toast.success(`Removed project: ${projTitle}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete project.');
    }
  };

  const handleAddCert = async (e) => {
    e.preventDefault();
    if (!newCert.name) return;
    try {
      await studentApi.addCertification(newCert);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      setIsCertModalOpen(false);
      setNewCert({ name: '', issuer: '', issueDate: '', credentialId: '' });
      toast.success(`Added certification: ${newCert.name}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add certification.');
    }
  };

  const handleDeleteCert = async (certId, certName) => {
    try {
      await studentApi.deleteCertification(certId);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      toast.success(`Removed certification: ${certName}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete certification.');
    }
  };

  const handleAddResume = async (e) => {
    e.preventDefault();
    if (!newResume.name) return;
    try {
      await studentApi.uploadResume(newResume);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      setIsResumeModalOpen(false);
      setNewResume({ name: '', fileUrl: '' });
      toast.success(`Uploaded resume: ${newResume.name}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to upload resume.');
    }
  };

  const handleDeleteResume = async (resumeId, resumeName) => {
    try {
      await studentApi.deleteResume(resumeId);
      const updated = await studentApi.getProfile();
      setProfile(updated);
      toast.success(`Removed resume: ${resumeName}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete resume.');
    }
  };

  if (loading || !profile) {
    return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Profile...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Student Profile"
        subtitle="Manage academic credentials, technical skills, projects, and resume portfolio."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSkillModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Skill
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Project
            </button>
          </div>
        }
      />

      {/* Main Profile Header Banner matching Stitch */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600/20 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{profile.name}</h2>
                <Badge variant="success" size="sm">
                  Verified Student
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {profile.department} • Batch {profile.batch}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile.currentLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Strength Widget */}
          <div className="w-full md:w-64 bg-indigo-50/70 p-4 rounded-xl border border-indigo-100/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Profile Strength
              </span>
              <strong className="text-indigo-700 font-extrabold">{profile.profileCompletion}%</strong>
            </div>
            <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${profile.profileCompletion}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Your profile is visible to recruiters.</p>
          </div>
        </div>
      </div>

      {/* Grid Layout for Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills & Proficiency */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" /> Skills & Technical Proficiency
              </h3>
              <button
                onClick={() => setIsSkillModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.skills.length === 0 ? (
                <p className="text-xs text-slate-400 italic col-span-2">No skills added yet.</p>
              ) : (
                profile.skills.map((skill) => (
                  <div key={skill.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900">{skill.name}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="primary" size="sm">
                          {skill.level}
                        </Badge>
                        <button
                          onClick={() => handleDeleteSkill(skill.id, skill.name)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                          title="Delete Skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <ProgressBar score={skill.rating} maxScore={100} showValues={false} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Featured Projects */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" /> Featured Projects
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            <div className="space-y-4">
              {profile.projects.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No projects added yet.</p>
              ) : (
                profile.projects.map((proj) => (
                  <div key={proj.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">{proj.duration}</span>
                        <button
                          onClick={() => handleDeleteProject(proj.id, proj.title)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {proj.technologies?.map((tech, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white text-slate-700 text-[10px] font-semibold border border-slate-200 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>

                      {proj.githubLink && (
                        <a
                          href={proj.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          GitHub Code <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Certifications & Licenses
              </h3>
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.certifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic col-span-2">No certifications added yet.</p>
              ) : (
                profile.certifications.map((cert) => (
                  <div key={cert.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{cert.name}</h4>
                      <button
                        onClick={() => handleDeleteCert(cert.id, cert.name)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                        title="Delete Certification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500">{cert.issuer}</p>
                    <p className="text-[10px] text-slate-400">Issued: {cert.issueDate} • ID: {cert.credentialId}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Resume & Academic Summary */}
        <div className="space-y-6">
          {/* Resume Management */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Resume Portfolio
              </h3>
              <button
                onClick={() => setIsResumeModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Resume
              </button>
            </div>

            {profile.resumes.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-400">No active resumes.</p>
                <button
                  onClick={() => setIsResumeModalOpen(true)}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Upload your resume now
                </button>
              </div>
            ) : (
              profile.resumes.map((res) => (
                <div key={res.id} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <FileText className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{res.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{res.size} • {res.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {res.isPrimary && <Badge variant="success">Primary</Badge>}
                      <button
                        onClick={() => handleDeleteResume(res.id, res.name)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-semibold">ATS Compatibility Score:</span>
                    <strong className="text-emerald-700 font-bold">{res.atsScore}%</strong>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/80">
                    <button
                      onClick={() => {
                        setSelectedResumeFile(res);
                        setResumePreviewModal(true);
                      }}
                      className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => toast.info(`Downloading ${res.name}...`)}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Academic Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> Academic Summary
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Overall CGPA</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">{profile.academics.overallCgpa}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Backlogs</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{profile.academics.activeBacklogs}</p>
              </div>
            </div>

            <a
              href="/student/academics"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 mt-2 transition-colors"
            >
              View Full Semester Breakdown →
            </a>
          </div>
        </div>
      </div>

      {/* Add Skill Modal */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title="Add Technical Skill"
        size="sm"
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Skill Name</label>
            <input
              type="text"
              required
              placeholder="e.g. React.js, Python, SQL"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Proficiency Level</label>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">
            Save Skill
          </button>
        </form>
      </Modal>

      {/* Add Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Add Portfolio Project"
        size="md"
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Title</label>
            <input
              type="text"
              required
              placeholder="Smart Campus Placement Portal"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              placeholder="Brief overview of project scope..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technologies (comma separated)</label>
            <input
              type="text"
              placeholder="React, Node.js, PostgreSQL"
              value={newProject.technologies}
              onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">
            Save Project
          </button>
        </form>
      </Modal>

      {/* Add Certification Modal */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Add Certification"
        size="sm"
      >
        <form onSubmit={handleAddCert} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Certification Name</label>
            <input
              type="text"
              required
              placeholder="AWS Certified Cloud Practitioner"
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issuing Organization</label>
            <input
              type="text"
              required
              placeholder="Amazon Web Services"
              value={newCert.issuer}
              onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">
            Save Certification
          </button>
        </form>
      </Modal>

      {/* Resume Preview Modal */}
      <Modal
        isOpen={resumePreviewModal}
        onClose={() => setResumePreviewModal(false)}
        title={selectedResumeFile ? `Resume Preview: ${selectedResumeFile.name}` : "Resume Preview"}
        size="lg"
      >
        <div className="bg-slate-100 p-8 rounded-xl border border-slate-200 min-h-[400px] flex flex-col items-center justify-center text-center">
          <FileText className="w-16 h-16 text-indigo-600 mb-3" />
          <h4 className="text-base font-bold text-slate-900">{selectedResumeFile?.name || profile.name}</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            CGPA {profile.cgpa} • {profile.department} • Verified ATS Match Score {selectedResumeFile?.atsScore || 90}%
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                toast.success('Resume downloaded!');
                setResumePreviewModal(false);
              }}
              className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download Original PDF
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Resume Modal */}
      <Modal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        title="Upload Resume"
        size="sm"
      >
        <form onSubmit={handleAddResume} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Resume Title / File Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul_Kumar_Resume_2026.pdf"
              value={newResume.name}
              onChange={(e) => setNewResume({ ...newResume, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">File URL or Cloud Link (Optional)</label>
            <input
              type="text"
              placeholder="https://drive.google.com/..."
              value={newResume.fileUrl}
              onChange={(e) => setNewResume({ ...newResume, fileUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">
            Upload Resume
          </button>
        </form>
      </Modal>
    </div>
  );
};
