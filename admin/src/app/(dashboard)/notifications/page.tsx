'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import {
  Bell,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  audience: 'all' | 'subscribers' | 'free';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_for: string | null;
  sent_at: string | null;
  sent_count: number | null;
  failed_count: number | null;
  created_at: string;
}

const audienceLabels: Record<NotificationCampaign['audience'], string> = {
  all: 'All Users',
  subscribers: 'Subscribers',
  free: 'Free Users',
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [audience, setAudience] = useState<NotificationCampaign['audience']>('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser || null);

      const { data, error: loadError } = await supabase
        .from('notification_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (loadError) {
        setError(loadError.message);
      } else {
        setNotifications((data || []) as NotificationCampaign[]);
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('send-notification', {
        body: {
          title: title.trim(),
          body: body.trim(),
          deep_link: deepLink.trim() || null,
          audience,
        },
      });

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      setSuccessMessage(
        `Notification sent. ${data?.sent ?? 0} delivered, ${data?.failed ?? 0} failed.`
      );
      setTitle('');
      setBody('');
      setDeepLink('');

      const { data: refreshed } = await supabase
        .from('notification_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      setNotifications((refreshed || []) as NotificationCampaign[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header user={user} title="Notifications" />
      <div className="p-6 space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Send Push Notification</h2>
              <p className="text-sm text-gray-500">
                Messages are delivered to devices with registered push tokens.
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Bell className="w-4 h-4 mr-2" />
              {notifications.length} total
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center">
              <XCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              {successMessage}
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="New lesson drop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Share the latest update with your members..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(event) => setAudience(event.target.value as NotificationCampaign['audience'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="subscribers">Subscribers</option>
                  <option value="free">Free Users</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deep Link (optional)
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={deepLink}
                    onChange={(event) => setDeepLink(event.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="/module/123"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Example: /module/123 or /events
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Recent Campaigns</h3>
            <Link href="/notifications" className="text-sm text-blue-600 hover:underline">
              Refresh
            </Link>
          </div>
          {loading ? (
            <div className="p-6 flex items-center text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No notifications sent yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{campaign.title}</div>
                        <p className="text-sm text-gray-500 line-clamp-2">{campaign.body}</p>
                        {campaign.deep_link && (
                          <p className="text-xs text-blue-600 mt-1">
                            {campaign.deep_link}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {audienceLabels[campaign.audience]}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            campaign.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : campaign.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : campaign.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(campaign.sent_at || campaign.scheduled_for)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {campaign.sent_count ?? 0} sent, {campaign.failed_count ?? 0} failed
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
