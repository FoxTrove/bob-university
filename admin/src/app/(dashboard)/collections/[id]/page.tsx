'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Upload,
  Video,
  Users,
  Calendar,
  Search,
  GripVertical,
  Check,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CollectionVideo {
  id: string;
  video_id: string;
  sort_order: number;
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    mux_playback_id: string | null;
    duration_seconds: number | null;
    is_published: boolean;
    module: {
      id: string;
      title: string;
    } | null;
  };
}

interface AvailableVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  duration_seconds: number | null;
  is_published: boolean;
  module_id: string | null;
  modules: {
    id: string;
    title: string;
  } | null;
}

interface CollectionAccess {
  id: string;
  user_id: string;
  granted_at: string;
  expires_at: string | null;
  source: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface LinkedEvent {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
}

interface Collection {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
}

// Draggable video card
function DraggableCollectionVideo({
  collectionVideo,
  onRemove,
}: {
  collectionVideo: CollectionVideo;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collectionVideo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const video = collectionVideo.video;
  const thumbnailUrl = video.thumbnail_url
    || (video.mux_playback_id
      ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=120&height=68&fit_mode=smartcrop`
      : null);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 bg-white rounded border shadow-sm ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 flex-shrink-0"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-100">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white/80" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {video.module && (
              <span className="text-xs text-gray-500">{video.module.title}</span>
            )}
            {video.duration_seconds && (
              <span className="text-xs text-gray-400">
                {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(collectionVideo.id)}
          className="p-1 text-gray-300 hover:text-red-500 flex-shrink-0"
          title="Remove from collection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;
  const supabase = createClient();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [collectionVideos, setCollectionVideos] = useState<CollectionVideo[]>([]);
  const [availableVideos, setAvailableVideos] = useState<AvailableVideo[]>([]);
  const [collectionAccess, setCollectionAccess] = useState<CollectionAccess[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Video picker state
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [videoSearch, setVideoSearch] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchData() {
      // Fetch collection
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('id, title, description, thumbnail_url, is_published')
        .eq('id', collectionId)
        .single();

      if (collectionError) {
        setError('Collection not found');
        setLoading(false);
        return;
      }

      setCollection(collectionData);
      setTitle(collectionData.title);
      setDescription(collectionData.description || '');
      setIsPublished(collectionData.is_published);
      setCoverImage(collectionData.thumbnail_url);

      // Fetch collection videos
      const { data: videosData } = await supabase
        .from('collection_videos')
        .select(`
          id,
          video_id,
          sort_order,
          video:videos (
            id,
            title,
            thumbnail_url,
            mux_playback_id,
            duration_seconds,
            is_published,
            module:modules (
              id,
              title
            )
          )
        `)
        .eq('collection_id', collectionId)
        .order('sort_order');

      setCollectionVideos((videosData || []) as unknown as CollectionVideo[]);

      // Fetch all available videos
      const { data: allVideos } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          thumbnail_url,
          mux_playback_id,
          duration_seconds,
          is_published,
          module_id,
          modules (
            id,
            title
          )
        `)
        .order('title');

      setAvailableVideos((allVideos || []) as unknown as AvailableVideo[]);

      // Fetch collection access
      const { data: accessData } = await supabase
        .from('collection_access')
        .select(`
          id,
          user_id,
          granted_at,
          expires_at,
          source,
          profile:profiles (
            id,
            email,
            full_name
          )
        `)
        .eq('collection_id', collectionId)
        .order('granted_at', { ascending: false });

      setCollectionAccess((accessData || []) as unknown as CollectionAccess[]);

      // Fetch linked events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, event_date, location')
        .eq('collection_id', collectionId)
        .order('event_date', { ascending: false });

      setLinkedEvents((eventsData || []) as LinkedEvent[]);

      setLoading(false);
    }

    fetchData();
  }, [collectionId, supabase]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail_url: coverImage,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId);

      if (updateError) throw updateError;

      router.push('/collections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (linkedEvents.length > 0) {
      setError('Cannot delete collection while events are linked to it. Remove the collection link from events first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this collection? This will also remove all user access grants.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from('collections').delete().eq('id', collectionId);
      if (error) throw error;
      router.push('/collections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
      setDeleting(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingCover(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `collection-${collectionId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      setCoverImage(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverImage(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = collectionVideos.findIndex((v) => v.id === active.id);
      const newIndex = collectionVideos.findIndex((v) => v.id === over.id);

      const reorderedVideos = arrayMove(collectionVideos, oldIndex, newIndex);
      const updatedVideos = reorderedVideos.map((v, index) => ({
        ...v,
        sort_order: index,
      }));

      setCollectionVideos(updatedVideos);

      // Update in database
      for (const video of updatedVideos) {
        await supabase
          .from('collection_videos')
          .update({ sort_order: video.sort_order })
          .eq('id', video.id);
      }
    }
  };

  const handleRemoveVideo = async (collectionVideoId: string) => {
    const { error } = await supabase
      .from('collection_videos')
      .delete()
      .eq('id', collectionVideoId);

    if (!error) {
      setCollectionVideos(collectionVideos.filter((v) => v.id !== collectionVideoId));
    }
  };

  const handleAddVideos = async () => {
    if (selectedVideoIds.size === 0) return;

    const existingVideoIds = new Set(collectionVideos.map((v) => v.video_id));
    const newVideoIds = Array.from(selectedVideoIds).filter((id) => !existingVideoIds.has(id));

    if (newVideoIds.length === 0) {
      setShowVideoPicker(false);
      setSelectedVideoIds(new Set());
      return;
    }

    const maxSortOrder = Math.max(0, ...collectionVideos.map((v) => v.sort_order));

    const inserts = newVideoIds.map((videoId, index) => ({
      collection_id: collectionId,
      video_id: videoId,
      sort_order: maxSortOrder + index + 1,
    }));

    const { data, error } = await supabase
      .from('collection_videos')
      .insert(inserts)
      .select(`
        id,
        video_id,
        sort_order,
        video:videos (
          id,
          title,
          thumbnail_url,
          mux_playback_id,
          duration_seconds,
          is_published,
          module:modules (
            id,
            title
          )
        )
      `);

    if (!error && data) {
      setCollectionVideos([...collectionVideos, ...(data as unknown as CollectionVideo[])]);
    }

    setShowVideoPicker(false);
    setSelectedVideoIds(new Set());
    setVideoSearch('');
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideoIds);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideoIds(newSelected);
  };

  // Filter available videos for picker
  const filteredVideos = availableVideos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(videoSearch.toLowerCase());
    return matchesSearch;
  });

  // Group by module for display
  const videosByModule = filteredVideos.reduce((acc, video) => {
    const moduleName = video.modules?.title || 'No Module';
    if (!acc[moduleName]) acc[moduleName] = [];
    acc[moduleName].push(video);
    return acc;
  }, {} as Record<string, AvailableVideo[]>);

  if (loading) {
    return (
      <>
        <Header user={null} title="Edit Collection" />
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  if (!collection) {
    return (
      <>
        <Header user={null} title="Edit Collection" />
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            Collection not found
          </div>
        </div>
      </>
    );
  }

  const existingVideoIds = new Set(collectionVideos.map((v) => v.video_id));

  return (
    <>
      <Header user={null} title="Edit Collection" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/collections"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Collections
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cover Image */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover Image</h2>

              {coverImage ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveCover}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Remove cover image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white/80 text-sm">No cover image</span>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverUpload}
                className="hidden"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white text-gray-900 ${
                  uploadingCover ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
              </label>
            </div>

            {/* Collection Details */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Details</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                {/* Published */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is-published"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is-published" className="ml-2 text-sm text-gray-700">
                    Published
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => router.push('/collections')}
                  className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Linked Events */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <Calendar className="w-5 h-5 inline mr-2" />
                Linked Events ({linkedEvents.length})
              </h2>

              {linkedEvents.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No events linked to this collection.</p>
                  <p className="text-xs mt-1">Link this collection from an event to grant registrants access.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {event.location && ` - ${event.location}`}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Videos and Access */}
          <div className="lg:col-span-2 space-y-6">
            {/* Videos in Collection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Videos in Collection ({collectionVideos.length})
                </h2>
                <button
                  onClick={() => setShowVideoPicker(true)}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Videos
                </button>
              </div>

              {collectionVideos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No videos in this collection yet.</p>
                  <p className="text-sm mt-1">Add videos that users with access can watch.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={collectionVideos.map((v) => v.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {collectionVideos.map((cv) => (
                        <DraggableCollectionVideo
                          key={cv.id}
                          collectionVideo={cv}
                          onRemove={handleRemoveVideo}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Drag to reorder videos
              </p>
            </div>

            {/* Access Grants */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  <Users className="w-5 h-5 inline mr-2" />
                  Access ({collectionAccess.length} users)
                </h2>
              </div>

              {collectionAccess.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No users have access yet.</p>
                  <p className="text-sm mt-1">Access is granted when users register for a linked event.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {collectionAccess.slice(0, 10).map((access) => (
                    <div key={access.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {access.profile?.full_name || access.profile?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">{access.profile?.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                          {access.source}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(access.granted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {collectionAccess.length > 10 && (
                    <p className="pt-3 text-sm text-gray-500 text-center">
                      And {collectionAccess.length - 10} more...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Picker Modal */}
      {showVideoPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Videos to Collection</h3>
              <button
                onClick={() => {
                  setShowVideoPicker(false);
                  setSelectedVideoIds(new Set());
                  setVideoSearch('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Video List */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(videosByModule).map(([moduleName, videos]) => (
                <div key={moduleName} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{moduleName}</h4>
                  <div className="space-y-1">
                    {videos.map((video) => {
                      const isSelected = selectedVideoIds.has(video.id);
                      const isAlreadyAdded = existingVideoIds.has(video.id);
                      const thumbnailUrl = video.thumbnail_url
                        || (video.mux_playback_id
                          ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=80&height=45&fit_mode=smartcrop`
                          : null);

                      return (
                        <button
                          key={video.id}
                          onClick={() => !isAlreadyAdded && toggleVideoSelection(video.id)}
                          disabled={isAlreadyAdded}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                            isAlreadyAdded
                              ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="w-5 h-5 flex-shrink-0">
                            {isAlreadyAdded ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : isSelected ? (
                              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                            )}
                          </div>
                          <div className="w-14 h-8 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                            {thumbnailUrl ? (
                              <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                            {video.duration_seconds && (
                              <p className="text-xs text-gray-500">
                                {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                              </p>
                            )}
                          </div>
                          {isAlreadyAdded && (
                            <span className="text-xs text-gray-400">Already added</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredVideos.length === 0 && (
                <p className="text-center text-gray-500 py-8">No videos found</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedVideoIds.size} video{selectedVideoIds.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowVideoPicker(false);
                    setSelectedVideoIds(new Set());
                    setVideoSearch('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVideos}
                  disabled={selectedVideoIds.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
