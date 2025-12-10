'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCollectionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [collectionType, setCollectionType] = useState<'event' | 'certification' | 'custom'>('event');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('collections')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          collection_type: collectionType,
          event_date: eventDate ? new Date(eventDate).toISOString() : null,
          event_location: eventLocation.trim() || null,
          is_published: isPublished,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/collections/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
      setSaving(false);
    }
  };

  return (
    <>
      <Header user={null} title="New Collection" />
      <div className="p-6 max-w-2xl">
        <Link
          href="/collections"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Collections
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Collection</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Collection Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Type
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'event', label: 'Event', desc: 'In-person class or workshop' },
                  { value: 'certification', label: 'Certification', desc: 'Certificate program' },
                  { value: 'custom', label: 'Custom', desc: 'General collection' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCollectionType(type.value as typeof collectionType)}
                    className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
                      collectionType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  collectionType === 'event'
                    ? 'e.g., Denver Masterclass - January 2025'
                    : collectionType === 'certification'
                    ? 'e.g., Precision Cutting Certification'
                    : 'e.g., Advanced Techniques Bundle'
                }
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
                placeholder="Describe this collection..."
              />
            </div>

            {/* Event-specific fields */}
            {collectionType === 'event' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date
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
                    Event Location
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Denver, CO"
                  />
                </div>
              </>
            )}

            {/* Publish */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Publish immediately</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                If unchecked, collection will be saved as a draft
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              onClick={() => router.push('/collections')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
