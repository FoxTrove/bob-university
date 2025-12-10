'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Collection {
  id: string;
  title: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    async function loadCollections() {
      const { data } = await supabase
        .from('collections')
        .select('id, title')
        .order('title');
      if (data) setCollections(data);
    }
    loadCollections();
  }, [supabase]);

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

    try {
      const priceInCents = priceCents ? Math.round(parseFloat(priceCents) * 100) : 0;
      const earlyBirdInCents = earlyBirdPriceCents ? Math.round(parseFloat(earlyBirdPriceCents) * 100) : null;

      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
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
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/events/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      setSaving(false);
    }
  };

  return (
    <>
      <Header user={null} title="New Event" />
      <div className="p-6 max-w-3xl">
        <Link
          href="/events"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Event</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Denver Masterclass - January 2025"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe this event..."
              />
            </div>

            {/* Date/Time Section */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Date & Time</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Denver, CO"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Denver Convention Center"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 123 Main St"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Pricing & Capacity</h3>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00 for free"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              {/* Early Bird Pricing */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Early Bird Pricing (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Early Bird Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={earlyBirdPriceCents}
                      onChange={(e) => setEarlyBirdPriceCents(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Discounted price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Early Bird Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={earlyBirdDeadline}
                      onChange={(e) => setEarlyBirdDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Collection Link */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Content Access</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Collection
                </label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No collection linked</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Registrants will automatically get access to videos in the linked collection.
                </p>
              </div>
            </div>

            {/* Publish Settings */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Publishing</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Publish event</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={registrationOpen}
                    onChange={(e) => setRegistrationOpen(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Registration open</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              onClick={() => router.push('/events')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
