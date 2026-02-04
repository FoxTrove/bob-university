import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Users, DollarSign, Edit, Clock, Inbox } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  location: string | null;
  venue_name: string | null;
  max_capacity: number | null;
  price_cents: number;
  is_published: boolean;
  registration_open: boolean;
  collection_id: string | null;
  created_at: string;
  registration_count: number;
  collection_title: string | null;
}

async function getEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      event_registrations (id),
      collections (title)
    `)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return (events || []).map((event) => ({
    ...event,
    registration_count: event.event_registrations?.length || 0,
    collection_title: event.collections?.title || null,
  }));
}

async function getPendingPrivateRequestsCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('private_event_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching private request count:', error);
    return 0;
  }

  return count || 0;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(0)}`;
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [events, pendingPrivateRequests] = await Promise.all([
    getEvents(),
    getPendingPrivateRequestsCount(),
  ]);

  const upcomingEvents = events.filter((e) => isUpcoming(e.event_date));
  const pastEvents = events.filter((e) => !isUpcoming(e.event_date));
  const totalRegistrations = events.reduce((sum, e) => sum + e.registration_count, 0);

  return (
    <>
      <Header user={user} title="Events" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-semibold">{events.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold">{upcomingEvents.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Past</p>
                <p className="text-2xl font-semibold">{pastEvents.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Registrations</p>
                <p className="text-2xl font-semibold">{totalRegistrations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">{events.length} events</p>
          <div className="flex items-center gap-3">
            <Link
              href="/events/requests"
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors relative"
            >
              <Inbox className="w-5 h-5 mr-2" />
              Private Requests
              {pendingPrivateRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingPrivateRequests}
                </span>
              )}
            </Link>
            <Link
              href="/events/new"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Event
            </Link>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrations
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
                  {upcomingEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/events/${event.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {event.title}
                          </Link>
                          {event.collection_title && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Linked: {event.collection_title}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(event.event_date)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatTime(event.event_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {event.venue_name || event.location ? (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.venue_name || event.location}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatPrice(event.price_cents)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.registration_count}
                          {event.max_capacity && ` / ${event.max_capacity}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              event.is_published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {event.is_published ? 'Published' : 'Draft'}
                          </span>
                          {event.is_published && (
                            <span
                              className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                event.registration_open
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {event.registration_open ? 'Open' : 'Closed'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/events/${event.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Events</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrations
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pastEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {event.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(event.event_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {event.venue_name || event.location || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.registration_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/events/${event.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                          title="View"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No events yet.</p>
            <p className="text-sm text-gray-400 mt-1">Create an event to manage in-person classes and workshops.</p>
          </div>
        )}
      </div>
    </>
  );
}
