import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { Plus, Layers, Video, Users, Edit, Calendar } from 'lucide-react';

interface LinkedEvent {
  id: string;
  title: string;
  event_date: string;
}

interface Collection {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  video_count: number;
  access_count: number;
  linked_events: LinkedEvent[];
}

async function getCollections(): Promise<Collection[]> {
  const supabase = await createClient();

  const { data: collections, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_videos (id),
      collection_access (id),
      events (id, title, event_date)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collections:', error);
    return [];
  }

  return (collections || []).map((collection) => ({
    ...collection,
    video_count: collection.collection_videos?.length || 0,
    access_count: collection.collection_access?.length || 0,
    linked_events: collection.events || [],
  }));
}

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const collections = await getCollections();

  const publishedCount = collections.filter((c) => c.is_published).length;
  const totalVideos = collections.reduce((sum, c) => sum + c.video_count, 0);

  return (
    <>
      <Header user={user} title="Collections" />
      <div className="p-6">
        {/* Header with description */}
        <div className="mb-6">
          <p className="text-gray-600">
            Collections are groups of videos that can be linked to events. When users register for an event, they get access to the linked collection.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Collections</p>
                <p className="text-2xl font-semibold">{collections.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Videos</p>
                <p className="text-2xl font-semibold">{totalVideos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Published</p>
                <p className="text-2xl font-semibold">{publishedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">{collections.length} collections</p>
          <Link
            href="/collections/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Collection
          </Link>
        </div>

        {/* Collections Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Videos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access
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
              {collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
                        {collection.thumbnail_url ? (
                          <img
                            src={collection.thumbnail_url}
                            alt={collection.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Layers className="w-4 h-4 text-white/80" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/collections/${collection.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                        >
                          {collection.title}
                        </Link>
                        {collection.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      {collection.video_count}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {collection.linked_events.length > 0 ? (
                      <div className="space-y-1">
                        {collection.linked_events.slice(0, 2).map((event) => (
                          <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className="flex items-center text-sm text-blue-600 hover:underline"
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            {event.title}
                          </Link>
                        ))}
                        {collection.linked_events.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{collection.linked_events.length - 2} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No events linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {collection.access_count}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        collection.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {collection.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/collections/${collection.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {collections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No collections yet.</p>
                    <p className="text-sm mt-1">Create a collection to group videos, then link it to an event.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
