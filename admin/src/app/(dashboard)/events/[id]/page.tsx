'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Link as LinkIcon,
  Save,
  Trash2,
  Download,
  CheckCircle,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

interface Collection {
  id: string;
  title: string;
}

interface Registration {
  id: string;
  user_id: string;
  status: 'registered' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  ticket_type: string;
  amount_paid_cents: number;
  registered_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  location: string | null;
  venue_name: string | null;
  venue_address: string | null;
  max_capacity: number | null;
  price_cents: number;
  early_bird_price_cents: number | null;
  early_bird_deadline: string | null;
  collection_id: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  registration_open: boolean;
  created_at: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const statusColors: Record<string, string> = {
  registered: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  attended: 'bg-purple-100 text-purple-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  registered: 'Registered',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  attended: 'Attended',
  no_show: 'No Show',
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [earlyBirdPriceCents, setEarlyBirdPriceCents] = useState('');
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) {
        setError('Failed to load event');
        setLoading(false);
        return;
      }

      setEvent(eventData);
      setTitle(eventData.title);
      setDescription(eventData.description || '');
      setEventDate(eventData.event_date ? new Date(eventData.event_date).toISOString().slice(0, 16) : '');
      setEventEndDate(eventData.event_end_date ? new Date(eventData.event_end_date).toISOString().slice(0, 16) : '');
      setLocation(eventData.location || '');
      setVenueName(eventData.venue_name || '');
      setVenueAddress(eventData.venue_address || '');
      setMaxCapacity(eventData.max_capacity?.toString() || '');
      setPriceCents(eventData.price_cents ? (eventData.price_cents / 100).toString() : '');
      setEarlyBirdPriceCents(eventData.early_bird_price_cents ? (eventData.early_bird_price_cents / 100).toString() : '');
      setEarlyBirdDeadline(eventData.early_bird_deadline ? new Date(eventData.early_bird_deadline).toISOString().slice(0, 16) : '');
      setCollectionId(eventData.collection_id || '');
      setIsPublished(eventData.is_published);
      setRegistrationOpen(eventData.registration_open);

      // Load registrations
      const { data: regData } = await supabase
        .from('event_registrations')
        .select(`
          *,
          profile:profiles (id, email, full_name)
        `)
        .eq('event_id', id)
        .order('registered_at', { ascending: false });

      setRegistrations(regData || []);

      // Load collections
      const { data: colData } = await supabase
        .from('collections')
        .select('id, title')
        .order('title');

      setCollections(colData || []);
      setLoading(false);
    }

    loadData();
  }, [id, supabase]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!eventDate) {
      setError('Event date is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const priceInCents = priceCents ? Math.round(parseFloat(priceCents) * 100) : 0;
      const earlyBirdInCents = earlyBirdPriceCents ? Math.round(parseFloat(earlyBirdPriceCents) * 100) : null;

      const { data, error: updateError } = await supabase.functions.invoke('manage-event', {
        body: {
          event_id: id,
          title: title.trim(),
          description: description.trim() || null,
          event_date: new Date(eventDate).toISOString(),
          event_end_date: eventEndDate ? new Date(eventEndDate).toISOString() : null,
          location: location.trim() || null,
          venue_name: venueName.trim() || null,
          venue_address: venueAddress.trim() || null,
          max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
          price_cents: priceInCents,
          early_bird_price_cents: earlyBirdInCents,
          early_bird_deadline: earlyBirdDeadline ? new Date(earlyBirdDeadline).toISOString() : null,
          collection_id: collectionId || null,
          is_published: isPublished,
          registration_open: registrationOpen,
        },
      });

      if (updateError) throw updateError;
      if (data?.error) throw new Error(data.error);

      setSuccessMessage('Event saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This will also delete all registrations.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      router.push('/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleUpdateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (newStatus === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('event_registrations')
        .update(updates)
        .eq('id', registrationId);

      if (updateError) throw updateError;

      // Refresh registrations
      const { data: regData } = await supabase
        .from('event_registrations')
        .select(`
          *,
          profile:profiles (id, email, full_name)
        `)
        .eq('event_id', id)
        .order('registered_at', { ascending: false });

      setRegistrations(regData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration');
    }
  };

  const handleExportRegistrations = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Amount Paid', 'Registered At'].join(','),
      ...registrations.map((r) => [
        r.profile?.full_name || 'Unknown',
        r.profile?.email || 'Unknown',
        r.status,
        `$${(r.amount_paid_cents / 100).toFixed(2)}`,
        formatShortDate(r.registered_at),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <Header user={null} title="Loading..." />
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Header user={null} title="Event Not Found" />
        <div className="p-6">
          <p className="text-gray-500">Event not found</p>
          <Link href="/events" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Events
          </Link>
        </div>
      </>
    );
  }

  const activeRegistrations = registrations.filter((r) => r.status !== 'cancelled');
  const confirmedRegistrations = registrations.filter((r) => r.status === 'confirmed' || r.status === 'attended');

  return (
    <>
      <Header user={null} title={event.title} />
      <div className="p-6">
        <Link
          href="/events"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Event Summary Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">{formatDate(event.event_date)}</span>
              </div>
              {(location || venueName) && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{venueName || location}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {activeRegistrations.length} registered
                  {maxCapacity && ` / ${maxCapacity} capacity`}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  ${(registrations.reduce((sum, r) => sum + r.amount_paid_cents, 0) / 100).toFixed(0)} revenue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </span>
                {isPublished && (
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                      registrationOpen ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {registrationOpen ? 'Open' : 'Closed'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowEventDetails(!showEventDetails)}
              className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="text-sm">Event Settings</span>
              {showEventDetails ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Event Details */}
        {showEventDetails && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteEvent}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Name
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Address
                    </label>
                    <input
                      type="text"
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceCents}
                      onChange={(e) => setPriceCents(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Early Bird Pricing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={earlyBirdPriceCents}
                        onChange={(e) => setEarlyBirdPriceCents(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={earlyBirdDeadline}
                        onChange={(e) => setEarlyBirdDeadline(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linked Collection
                  </label>
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">No collection linked</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {collectionId && (
                    <Link
                      href={`/collections/${collectionId}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:underline mt-1"
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Manage collection videos
                    </Link>
                  )}
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Published</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={registrationOpen}
                      onChange={(e) => setRegistrationOpen(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Registration Open</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registrations Table - Main Focus */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Registrations</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeRegistrations.length} active, {confirmedRegistrations.length} confirmed
              </p>
            </div>
            <button
              onClick={handleExportRegistrations}
              disabled={registrations.length === 0}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>

          {registrations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No registrations yet</p>
              <p className="text-sm mt-1">Registrations will appear here once users sign up for this event.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {reg.profile?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">{reg.profile?.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[reg.status]
                        }`}
                      >
                        {statusLabels[reg.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ${(reg.amount_paid_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatShortDate(reg.registered_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {reg.status === 'registered' && (
                          <button
                            onClick={() => handleUpdateRegistrationStatus(reg.id, 'confirmed')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Confirm"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {reg.status !== 'cancelled' && reg.status !== 'attended' && (
                          <button
                            onClick={() => handleUpdateRegistrationStatus(reg.id, 'cancelled')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        {(reg.status === 'registered' || reg.status === 'confirmed') && (
                          <button
                            onClick={() => handleUpdateRegistrationStatus(reg.id, 'attended')}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="Mark Attended"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
