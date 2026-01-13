'use client';

import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import {
  Award,
  Save,
  Users,
  Clock,
  CheckCircle,
  DollarSign,
  Play,
  X,
  Check,
  XCircle,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  is_published: boolean;
}

interface CertificationSettings {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  badge_image_url: string | null;
  requires_review: boolean;
  is_active: boolean;
}

interface UserCertification {
  id: string;
  user_id: string;
  certification_id: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  submission_video_url: string | null;
  feedback: string | null;
  attempt_number: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  certification: {
    id: string;
    title: string;
  } | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  resubmitted: 'bg-purple-100 text-purple-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  resubmitted: 'Resubmitted',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function CertificationsPage() {
  const supabase = createClient();

  // Settings state
  const [certifications, setCertifications] = useState<CertificationSettings[]>([]);
  const [selectedCertificationId, setSelectedCertificationId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState('29700');
  const [badgeImageUrl, setBadgeImageUrl] = useState('');
  const [requiresReview, setRequiresReview] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Required modules state
  const [modules, setModules] = useState<Module[]>([]);
  const [requiredModuleIds, setRequiredModuleIds] = useState<Set<string>>(new Set());

  // Submissions state
  const [submissions, setSubmissions] = useState<UserCertification[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [certificationFilter, setCertificationFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<UserCertification | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedCertificationId) {
      setRequiredModuleIds(new Set());
      return;
    }

    const selected = certifications.find((item) => item.id === selectedCertificationId) || null;

    if (selected) {
      setTitle(selected.title);
      setDescription(selected.description || '');
      setPriceCents(selected.price_cents.toString());
      setBadgeImageUrl(selected.badge_image_url || '');
      setRequiresReview(selected.requires_review);
      setIsActive(selected.is_active);
      setIsCreatingNew(false);
    }

    loadRequiredModules(selectedCertificationId);
  }, [selectedCertificationId, certifications]);

  async function loadData() {
    setLoading(true);

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser || null);

    // Load certification settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('certification_settings')
      .select('*')
      .order('created_at', { ascending: true });

    if (settingsError) {
      setError('Failed to load certification settings');
      setLoading(false);
      return;
    }

    const settingsList = settingsData || [];
    setCertifications(settingsList);

    const nextSelectedId = selectedCertificationId || settingsList[0]?.id || null;
    setSelectedCertificationId(nextSelectedId);

    const selectedSettings = settingsList.find((item) => item.id === nextSelectedId) || null;

    if (selectedSettings) {
      setTitle(selectedSettings.title);
      setDescription(selectedSettings.description || '');
      setPriceCents(selectedSettings.price_cents.toString());
      setBadgeImageUrl(selectedSettings.badge_image_url || '');
      setRequiresReview(selectedSettings.requires_review);
      setIsActive(selectedSettings.is_active);
      setIsCreatingNew(false);
    } else {
      setTitle('');
      setDescription('');
      setPriceCents('29700');
      setBadgeImageUrl('');
      setRequiresReview(true);
      setIsActive(true);
      setIsCreatingNew(true);
    }

    // Load all modules
    const { data: modulesData } = await supabase
      .from('modules')
      .select('id, title, is_published')
      .order('sort_order');

    if (modulesData) {
      setModules(modulesData);
    }

    // Load submissions with profile info
    const { data: submissionsData } = await supabase
      .from('user_certifications')
      .select(`
        *,
        profile:profiles (
          id,
          email,
          full_name
        ),
        certification:certification_settings (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (submissionsData) {
      setSubmissions(submissionsData);
    }

    setLoading(false);
  }

  async function loadRequiredModules(certificationId: string) {
    const { data: requiredData } = await supabase
      .from('certification_required_modules')
      .select('module_id')
      .eq('certification_id', certificationId);

    if (requiredData) {
      setRequiredModuleIds(new Set(requiredData.map(r => r.module_id)));
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        price_cents: parseInt(priceCents) || 29700,
        badge_image_url: badgeImageUrl.trim() || null,
        requires_review: requiresReview,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      let activeCertificationId = selectedCertificationId;

      if (!selectedCertificationId || isCreatingNew) {
        const { data: inserted, error: insertError } = await supabase
          .from('certification_settings')
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;

        activeCertificationId = inserted.id;
        setCertifications((prev) => [...prev, inserted]);
        setSelectedCertificationId(inserted.id);
        setIsCreatingNew(false);
      } else {
        const { error: updateError } = await supabase
          .from('certification_settings')
          .update(payload)
          .eq('id', selectedCertificationId);

        if (updateError) throw updateError;

        setCertifications((prev) =>
          prev.map((item) => (item.id === selectedCertificationId ? { ...item, ...payload } : item))
        );
      }

      // Update required modules
      // First, delete all existing
      await supabase
        .from('certification_required_modules')
        .delete()
        .eq('certification_id', activeCertificationId);

      // Then insert new ones
      if (requiredModuleIds.size > 0) {
        const inserts = Array.from(requiredModuleIds).map(moduleId => ({
          module_id: moduleId,
          certification_id: activeCertificationId,
        }));

        const { error: insertError } = await supabase
          .from('certification_required_modules')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleStartNewCertification() {
    setSelectedCertificationId(null);
    setTitle('');
    setDescription('');
    setPriceCents('29700');
    setBadgeImageUrl('');
    setRequiresReview(true);
    setIsActive(true);
    setRequiredModuleIds(new Set());
    setIsCreatingNew(true);
  }

  function toggleRequiredModule(moduleId: string) {
    const newSet = new Set(requiredModuleIds);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setRequiredModuleIds(newSet);
  }

  async function handleApprove(submission: UserCertification) {
    try {
      const { error } = await supabase
        .from('user_certifications')
        .update({
          status: 'approved',
          feedback: feedbackText.trim() || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(s =>
          s.id === submission.id
            ? { ...s, status: 'approved', feedback: feedbackText.trim() || null, approved_at: new Date().toISOString() }
            : s
        )
      );
      setSelectedSubmission(null);
      setFeedbackText('');
      setSuccessMessage('Certification approved!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  }

  async function handleReject(submission: UserCertification) {
    if (!feedbackText.trim()) {
      setError('Please provide feedback for rejection');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_certifications')
        .update({
          status: 'rejected',
          feedback: feedbackText.trim(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(s =>
          s.id === submission.id
            ? { ...s, status: 'rejected', feedback: feedbackText.trim() }
            : s
        )
      );
      setSelectedSubmission(null);
      setFeedbackText('');
      setSuccessMessage('Submission rejected with feedback');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  }

  function openVideoModal(url: string) {
    setVideoUrl(url);
    setShowVideoModal(true);
  }

  function handleExportCSV() {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Certification', 'Attempt', 'Submitted', 'Approved', 'Feedback'].join(','),
      ...submissions.map(s => [
        s.profile?.full_name || 'Unknown',
        s.profile?.email || 'Unknown',
        s.status,
        s.certification?.title || 'Unknown',
        s.attempt_number,
        s.submitted_at ? formatDate(s.submitted_at) : '',
        s.approved_at ? formatDate(s.approved_at) : '',
        `"${(s.feedback || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certifications_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesStatus = statusFilter === 'all' ? true : submission.status === statusFilter;
    const matchesCert = certificationFilter === 'all'
      ? true
      : submission.certification_id === certificationFilter;
    return matchesStatus && matchesCert;
  });

  // Stats calculations
  const totalCertified = submissions.filter(s => s.status === 'approved').length;
  const pendingReview = submissions.filter(s => s.status === 'submitted' || s.status === 'resubmitted').length;
  const thisMonth = submissions.filter(s => {
    if (s.status !== 'approved' || !s.approved_at) return false;
    const approvedDate = new Date(s.approved_at);
    const now = new Date();
    return approvedDate.getMonth() === now.getMonth() && approvedDate.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <>
        <Header user={user} title="Certifications" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} title="Certifications" />
      <div className="p-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Certified</p>
                <p className="text-2xl font-semibold">{totalCertified}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold">{pendingReview}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Approved This Month</p>
                <p className="text-2xl font-semibold">{thisMonth}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-2xl font-semibold">{formatPrice(parseInt(priceCents) || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-6 py-4 flex items-center justify-between text-left border-b"
          >
            <div className="flex items-center">
              <Award className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-semibold">Certification Settings</span>
            </div>
            {showSettings ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showSettings && (
            <div className="p-6">
              <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Certification
                  </label>
                  <select
                    value={selectedCertificationId || ''}
                    onChange={(e) => setSelectedCertificationId(e.target.value || null)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[220px]"
                    disabled={certifications.length === 0}
                  >
                    {certifications.length === 0 ? (
                      <option value="">No certifications</option>
                    ) : (
                      certifications.map((cert) => (
                        <option key={cert.id} value={cert.id}>
                          {cert.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <button
                  onClick={handleStartNewCertification}
                  className="flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  New Certification
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certification Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Ray-Certified Stylist"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Describe what this certification means..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (in cents)
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="number"
                        value={Math.round(parseInt(priceCents || '0') / 100)}
                        onChange={(e) => setPriceCents((parseInt(e.target.value) * 100).toString())}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                      <span className="text-gray-400 ml-2 text-sm">({priceCents} cents)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge Image URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={badgeImageUrl}
                        onChange={(e) => setBadgeImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        placeholder="https://..."
                      />
                      {badgeImageUrl && (
                        <img
                          src={badgeImageUrl}
                          alt="Badge preview"
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={requiresReview}
                        onChange={(e) => setRequiresReview(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Requires Video Review</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                {/* Right Column - Required Modules */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Modules
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Select which modules must be completed before a user can purchase certification.
                  </p>
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {modules.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No modules found
                      </div>
                    ) : (
                      modules.map((module) => (
                        <label
                          key={module.id}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={requiredModuleIds.has(module.id)}
                            onChange={() => toggleRequiredModule(module.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">{module.title}</span>
                          {!module.is_published && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              Draft
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {requiredModuleIds.size} module{requiredModuleIds.size !== 1 ? 's' : ''} required
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submissions Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-semibold">Certification Submissions</span>
              <span className="ml-2 text-sm text-gray-500">({filteredSubmissions.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <Filter className="w-4 h-4 text-gray-400 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="resubmitted">Resubmitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center">
                <select
                  value={certificationFilter}
                  onChange={(e) => setCertificationFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="all">All Certifications</option>
                  {certifications.map((cert) => (
                    <option key={cert.id} value={cert.id}>
                      {cert.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </button>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No submissions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Submissions will appear here when users apply for certification.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {submission.profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.profile?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[submission.status]}`}
                        >
                          {statusLabels[submission.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {submission.certification?.title || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        #{submission.attempt_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {submission.submitted_at ? formatDate(submission.submitted_at) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {submission.submission_video_url ? (
                          <button
                            onClick={() => openVideoModal(submission.submission_video_url!)}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Watch
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No video</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(submission.status === 'submitted' || submission.status === 'resubmitted') && (
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setFeedbackText(submission.feedback || '');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Review
                          </button>
                        )}
                        {submission.status === 'approved' && (
                          <span className="text-green-600 text-sm flex items-center justify-end">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Certified
                          </span>
                        )}
                        {submission.status === 'rejected' && (
                          <span className="text-red-600 text-sm">Rejected</span>
                        )}
                        {submission.status === 'pending' && (
                          <span className="text-gray-400 text-sm">Awaiting submission</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Review Submission</h3>
                <button onClick={() => setSelectedSubmission(null)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedSubmission.profile?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedSubmission.profile?.email}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Certification</p>
                  <p className="font-medium">{selectedSubmission.certification?.title || 'Unknown'}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Attempt #{selectedSubmission.attempt_number}</p>
                  {selectedSubmission.submitted_at && (
                    <p className="text-sm">Submitted: {formatDate(selectedSubmission.submitted_at)}</p>
                  )}
                </div>

                {selectedSubmission.submission_video_url && (
                  <div className="mb-4">
                    <button
                      onClick={() => openVideoModal(selectedSubmission.submission_video_url!)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Watch Submission Video
                    </button>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="Provide feedback for the applicant..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Feedback is required for rejection.
                  </p>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedSubmission)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedSubmission)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X className="w-8 h-8" />
              </button>
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
