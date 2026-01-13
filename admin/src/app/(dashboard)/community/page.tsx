'use client';

import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import {
  MessageSquare,
  Flag,
  Users,
  Ban,
  CheckCircle,
  XCircle,
  X,
  Eye,
  Trash2,
  AlertTriangle,
  Filter,
  Download,
  Image,
  FileText,
} from 'lucide-react';

interface CommunityReport {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  reporter: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  post: {
    id: string;
    content: string | null;
    media_urls: { url: string; type: string }[];
    user_id: string;
    profile: {
      full_name: string | null;
      email: string;
    } | null;
  } | null;
  comment: {
    id: string;
    content: string;
    user_id: string;
    profile: {
      full_name: string | null;
      email: string;
    } | null;
  } | null;
}

interface BannedUser {
  id: string;
  user_id: string;
  reason: string;
  banned_until: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string;
  } | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  dismissed: 'bg-gray-100 text-gray-800',
  actioned: 'bg-green-100 text-green-800',
};

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  misinformation: 'Misinformation',
  other: 'Other',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CommunityModerationPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<string>('permanent');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stats
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsToday, setPostsToday] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser || null);

    // Load reports with related data
    const { data: reportsData, error: reportsError } = await supabase
      .from('community_reports')
      .select(`
        *,
        reporter:profiles!community_reports_reporter_id_fkey (
          id, email, full_name
        ),
        post:community_posts (
          id, content, media_urls, user_id,
          profile:profiles (full_name, email)
        ),
        comment:community_comments (
          id, content, user_id,
          profile:profiles (full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error loading reports:', reportsError);
      setError('Failed to load reports');
    } else {
      setReports(reportsData || []);
    }

    // Load banned users
    const { data: bannedData } = await supabase
      .from('community_bans')
      .select(`
        *,
        profile:profiles (full_name, email)
      `)
      .order('created_at', { ascending: false });

    setBannedUsers(bannedData || []);

    // Load stats
    const { count: totalCount } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true });
    setTotalPosts(totalCount || 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    setPostsToday(todayCount || 0);

    setLoading(false);
  }

  async function handleDismissReport(report: CommunityReport) {
    try {
      const { error } = await supabase
        .from('community_reports')
        .update({
          status: 'dismissed',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          action_taken: 'Report dismissed - no violation found',
        })
        .eq('id', report.id);

      if (error) throw error;

      setReports(prev =>
        prev.map(r => r.id === report.id ? { ...r, status: 'dismissed' } : r)
      );
      setSelectedReport(null);
      setSuccessMessage('Report dismissed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss report');
    }
  }

  async function handleHideContent(report: CommunityReport) {
    try {
      const table = report.post_id ? 'community_posts' : 'community_comments';
      const id = report.post_id || report.comment_id;

      // Hide the content
      const { error: hideError } = await supabase
        .from(table)
        .update({
          is_hidden: true,
          hidden_reason: `Violated community guidelines: ${reasonLabels[report.reason]}`,
          hidden_by: user?.id,
          hidden_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (hideError) throw hideError;

      // Update report status
      const { error: reportError } = await supabase
        .from('community_reports')
        .update({
          status: 'actioned',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          action_taken: 'Content hidden',
        })
        .eq('id', report.id);

      if (reportError) throw reportError;

      setReports(prev =>
        prev.map(r => r.id === report.id ? { ...r, status: 'actioned' } : r)
      );
      setSelectedReport(null);
      setSuccessMessage('Content hidden successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hide content');
    }
  }

  function openBanModal(userId: string) {
    setBanUserId(userId);
    setBanReason('');
    setBanDuration('permanent');
    setShowBanModal(true);
  }

  async function handleBanUser() {
    if (!banUserId || !banReason.trim()) {
      setError('Please provide a reason for the ban');
      return;
    }

    try {
      let bannedUntil = null;
      if (banDuration !== 'permanent') {
        const days = parseInt(banDuration);
        bannedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from('community_bans')
        .insert({
          user_id: banUserId,
          reason: banReason.trim(),
          banned_by: user?.id,
          banned_until: bannedUntil,
        });

      if (error) throw error;

      // If we have a selected report, update it
      if (selectedReport) {
        await supabase
          .from('community_reports')
          .update({
            status: 'actioned',
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
            action_taken: `User banned ${banDuration === 'permanent' ? 'permanently' : `for ${banDuration} days`}`,
          })
          .eq('id', selectedReport.id);

        setReports(prev =>
          prev.map(r => r.id === selectedReport.id ? { ...r, status: 'actioned' } : r)
        );
      }

      setShowBanModal(false);
      setSelectedReport(null);
      setBanUserId(null);
      setBanReason('');
      loadData(); // Refresh banned users list
      setSuccessMessage('User banned successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
    }
  }

  async function handleUnbanUser(ban: BannedUser) {
    try {
      const { error } = await supabase
        .from('community_bans')
        .delete()
        .eq('id', ban.id);

      if (error) throw error;

      setBannedUsers(prev => prev.filter(b => b.id !== ban.id));
      setSuccessMessage('User unbanned successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user');
    }
  }

  const filteredReports = reports.filter(r =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <>
        <Header user={user} title="Community Moderation" />
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
      <Header user={user} title="Community Moderation" />
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Posts</p>
                <p className="text-2xl font-semibold">{totalPosts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending Reports</p>
                <p className="text-2xl font-semibold">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Posts Today</p>
                <p className="text-2xl font-semibold">{postsToday}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Ban className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Banned Users</p>
                <p className="text-2xl font-semibold">{bannedUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Flag className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-semibold">Reported Content</span>
              <span className="ml-2 text-sm text-gray-500">({filteredReports.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="pending">Pending</option>
                <option value="actioned">Actioned</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">No {statusFilter === 'all' ? '' : statusFilter} reports</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter === 'pending'
                  ? 'Great! The community is behaving well.'
                  : 'No reports match the current filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => {
                    const content = report.post?.content || report.comment?.content || 'No content';
                    const author = report.post?.profile || report.comment?.profile;
                    const contentUserId = report.post?.user_id || report.comment?.user_id;
                    const hasMedia = (report.post?.media_urls?.length || 0) > 0;

                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-start">
                            {hasMedia && (
                              <Image className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                            )}
                            <p className="text-sm text-gray-900 truncate">
                              {content.slice(0, 100)}
                              {content.length > 100 ? '...' : ''}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {report.post_id ? 'Post' : 'Comment'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {author?.full_name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {author?.email || 'No email'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {reasonLabels[report.reason]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {report.reporter?.full_name || report.reporter?.email || 'Unknown'}
                          <div className="text-xs text-gray-400">
                            {formatDate(report.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[report.status]}`}
                          >
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {report.status === 'pending' ? (
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              {report.action_taken || 'Reviewed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Banned Users Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex items-center">
            <Ban className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-semibold">Banned Users</span>
            <span className="ml-2 text-sm text-gray-500">({bannedUsers.length})</span>
          </div>

          {bannedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No banned users</p>
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
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banned On
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bannedUsers.map((ban) => (
                    <tr key={ban.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {ban.profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ban.profile?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ban.reason}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ban.banned_until ? (
                          <span>Until {formatDate(ban.banned_until)}</span>
                        ) : (
                          <span className="text-red-600 font-medium">Permanent</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(ban.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleUnbanUser(ban)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">Review Report</h3>
                <button onClick={() => setSelectedReport(null)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                {/* Report Info */}
                <div className="mb-4 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center text-red-800 mb-2">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="font-medium">Reported for: {reasonLabels[selectedReport.reason]}</span>
                  </div>
                  {selectedReport.details && (
                    <p className="text-sm text-red-700">{selectedReport.details}</p>
                  )}
                  <p className="text-xs text-red-600 mt-2">
                    Reported by {selectedReport.reporter?.full_name || selectedReport.reporter?.email} on {formatDate(selectedReport.created_at)}
                  </p>
                </div>

                {/* Content Preview */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selectedReport.post_id ? 'Post Content' : 'Comment Content'}
                  </p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">
                      {selectedReport.post?.content || selectedReport.comment?.content || 'No content'}
                    </p>
                    {selectedReport.post?.media_urls?.map((media, i) => (
                      <img
                        key={i}
                        src={media.url}
                        alt="Post media"
                        className="mt-2 max-w-full h-auto rounded-lg max-h-64 object-cover"
                      />
                    ))}
                  </div>
                </div>

                {/* Author Info */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Content Author</p>
                  <p className="text-gray-900">
                    {selectedReport.post?.profile?.full_name || selectedReport.comment?.profile?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedReport.post?.profile?.email || selectedReport.comment?.profile?.email || 'No email'}
                  </p>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-between">
                <button
                  onClick={() => handleDismissReport(selectedReport)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Dismiss Report
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleHideContent(selectedReport)}
                    className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Hide Content
                  </button>
                  <button
                    onClick={() => {
                      const userId = selectedReport.post?.user_id || selectedReport.comment?.user_id;
                      if (userId) openBanModal(userId);
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Ban User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ban User</h3>
                <button onClick={() => setShowBanModal(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ban Duration
                  </label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Ban *
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="Explain why this user is being banned..."
                  />
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
