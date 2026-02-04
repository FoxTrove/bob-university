import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, MapPin, Clock, MessageSquare } from 'lucide-react';

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

async function getPrivateEventRequests(): Promise<PrivateEventRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('private_event_requests')
    .select(`
      *,
      salon:salons(id, name),
      requester:profiles!requested_by_user_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching private event requests:', error);
    return [];
  }

  return data || [];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

function getStatusBadge(status: string): { bg: string; text: string; label: string } {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Review' },
    reviewing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Reviewing' },
    scheduled_call: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Call Scheduled' },
    confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
    declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
  };
  return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
}

export default async function PrivateEventRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const requests = await getPrivateEventRequests();

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const activeRequests = requests.filter((r) => ['reviewing', 'scheduled_call'].includes(r.status));
  const resolvedRequests = requests.filter((r) =>
    ['confirmed', 'declined', 'cancelled'].includes(r.status)
  );

  return (
    <>
      <Header user={user} title="Private Event Requests" />
      <div className="p-6">
        {/* Back Link */}
        <Link
          href="/events"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-semibold">{pendingRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold">{activeRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-2xl font-semibold">
                  {requests.filter((r) => r.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold">{requests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Review</h2>
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}

        {/* Active Requests */}
        {activeRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">In Progress</h2>
            <div className="grid gap-4">
              {activeRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}

        {/* Resolved Requests */}
        {resolvedRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolved</h2>
            <div className="grid gap-4">
              {resolvedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {requests.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No private event requests yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Salon owners can submit requests through the mobile app.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function RequestCard({ request }: { request: PrivateEventRequest }) {
  const statusBadge = getStatusBadge(request.status);

  return (
    <Link href={`/events/requests/${request.id}`}>
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{request.salon?.name || 'Unknown Salon'}</h3>
              <span
                className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {formatEventType(request.event_type)} • {request.estimated_attendees} attendees
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(request.preferred_start_date)}
                {request.preferred_end_date && ` - ${formatDate(request.preferred_end_date)}`}
                {request.flexible_dates && ' (Flexible)'}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {formatLocationType(request.location_type)}
                {request.salon_address && ` • ${request.salon_address.substring(0, 30)}...`}
                {request.preferred_city && ` • ${request.preferred_city}`}
              </div>
            </div>
            {request.special_requests && (
              <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                <span className="font-medium">Notes:</span> {request.special_requests}
              </p>
            )}
          </div>
          <div className="text-right ml-4">
            <p className="text-xs text-gray-400">Submitted</p>
            <p className="text-sm text-gray-600">{formatDate(request.created_at)}</p>
            <p className="text-xs text-gray-500 mt-1">{request.requester?.full_name || request.requester?.email}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
