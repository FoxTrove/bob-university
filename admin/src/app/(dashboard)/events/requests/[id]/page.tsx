'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Clock,
  Building,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';

interface PrivateEventRequest {
  id: string;
  event_type: 'team_training' | 'certification_prep' | 'advanced_workshop' | 'custom';
  preferred_start_date: string;
  preferred_end_date: string | null;
  flexible_dates: boolean;
  estimated_attendees: number;
  location_type: 'at_salon' | 'nearby_venue' | 'virtual' | 'flexible';
  salon_address: string | null;
  preferred_city: string | null;
  special_requests: string | null;
  status: 'pending' | 'reviewing' | 'scheduled_call' | 'confirmed' | 'declined' | 'cancelled';
  admin_notes: string | null;
  scheduled_call_at: string | null;
  created_at: string;
  updated_at: string;
  salon: {
    id: string;
    name: string;
  };
  requester: {
    id: string;
    full_name: string;
    email: string;
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    team_training: 'Team Training',
    certification_prep: 'Certification Prep',
    advanced_workshop: 'Advanced Workshop',
    custom: 'Custom Event',
  };
  return labels[type] || type;
}

function formatLocationType(type: string): string {
  const labels: Record<string, string> = {
    at_salon: 'At Salon',
    nearby_venue: 'Nearby Venue',
    virtual: 'Virtual',
    flexible: 'Flexible',
  };
  return labels[type] || type;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'scheduled_call', label: 'Call Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PrivateEventRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [request, setRequest] = useState<PrivateEventRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState('');
  const [scheduledCallAt, setScheduledCallAt] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    const { data, error } = await supabase
      .from('private_event_requests')
      .select(`
        *,
        salon:salons(id, name),
        requester:profiles!requested_by_user_id(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching request:', error);
      router.push('/events/requests');
      return;
    }

    setRequest(data);
    setAdminNotes(data.admin_notes || '');
    setStatus(data.status);
    setScheduledCallAt(data.scheduled_call_at || '');
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('private_event_requests')
        .update({
          status,
          admin_notes: adminNotes || null,
          scheduled_call_at: scheduledCallAt || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await fetchRequest();
      alert('Request updated successfully!');
    } catch (err) {
      console.error('Error updating request:', err);
      alert('Failed to update request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <p>Request not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link
          href="/events/requests"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Requests
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {request.salon?.name || 'Unknown Salon'}
            </h1>
            <p className="text-gray-600">{formatEventType(request.event_type)} Request</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Event Type</p>
                    <p className="font-medium">{formatEventType(request.event_type)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Attendees</p>
                    <p className="font-medium">{request.estimated_attendees} people</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Preferred Dates</p>
                    <p className="font-medium">
                      {formatDate(request.preferred_start_date)}
                      {request.preferred_end_date && (
                        <span> - {formatDate(request.preferred_end_date)}</span>
                      )}
                    </p>
                    {request.flexible_dates && (
                      <p className="text-sm text-green-600">Flexible on dates</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location Preference</p>
                    <p className="font-medium">{formatLocationType(request.location_type)}</p>
                    {request.salon_address && (
                      <p className="text-sm text-gray-600 mt-1">{request.salon_address}</p>
                    )}
                    {request.preferred_city && (
                      <p className="text-sm text-gray-600 mt-1">{request.preferred_city}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {request.special_requests && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Special Requests
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{request.special_requests}</p>
              </div>
            )}

            {/* Admin Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Admin Notes
              </h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this request..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {status === 'scheduled_call' && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-1">Scheduled Call Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledCallAt ? scheduledCallAt.slice(0, 16) : ''}
                    onChange={(e) => setScheduledCallAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-sm text-gray-700">{formatDateTime(request.created_at)}</p>
                {request.updated_at !== request.created_at && (
                  <>
                    <p className="text-xs text-gray-500 mt-2">Last Updated</p>
                    <p className="text-sm text-gray-700">{formatDateTime(request.updated_at)}</p>
                  </>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Salon</p>
                    <p className="font-medium">{request.salon?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Requested By</p>
                    <p className="font-medium">{request.requester?.full_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${request.requester?.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {request.requester?.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href={`mailto:${request.requester?.email}?subject=Your Private Event Request - ${request.salon?.name}`}
                  className="flex items-center w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </a>
                <button
                  onClick={() => {
                    setStatus('confirmed');
                    handleSave();
                  }}
                  disabled={saving || status === 'confirmed'}
                  className="flex items-center w-full px-4 py-2 text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Event
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to decline this request?')) {
                      setStatus('declined');
                      handleSave();
                    }
                  }}
                  disabled={saving || status === 'declined'}
                  className="flex items-center w-full px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
