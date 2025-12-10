'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { GripVertical, Plus, Trash2, Save, Upload, X, ArrowLeft, Wand2, Settings2, Check } from 'lucide-react';
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

interface Video {
  id: string;
  title: string;
  duration_seconds: number | null;
  is_free: boolean;
  is_published: boolean;
  sort_order: number;
  mux_playback_id: string | null;
  drip_days: number | null;
  thumbnail_url: string | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  sort_order: number;
  drip_days: number | null;
  drip_buckets: DripBucketType[] | null;
}

// Drip bucket type
interface DripBucketType {
  id: string;
  label: string;
  days: number;
  color: string;
}

// Default bucket configuration
const DEFAULT_DRIP_BUCKETS: DripBucketType[] = [
  { id: 'immediate', label: 'Immediate', days: 0, color: 'bg-green-100 border-green-300 text-green-800' },
  { id: 'week1', label: 'Week 1', days: 7, color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { id: 'week2', label: 'Week 2', days: 14, color: 'bg-purple-100 border-purple-300 text-purple-800' },
  { id: 'week3', label: 'Week 3', days: 21, color: 'bg-pink-100 border-pink-300 text-pink-800' },
  { id: 'month1', label: 'Month 1', days: 30, color: 'bg-orange-100 border-orange-300 text-orange-800' },
];

// Available colors for buckets
const BUCKET_COLORS = [
  'bg-green-100 border-green-300 text-green-800',
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-red-100 border-red-300 text-red-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-gray-100 border-gray-300 text-gray-800',
];

function getBucketForDays(days: number | null, buckets: DripBucketType[]): DripBucketType {
  const d = days || 0;
  // Find the bucket that matches or the closest one
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (d >= buckets[i].days) {
      return buckets[i];
    }
  }
  return buckets[0] || DEFAULT_DRIP_BUCKETS[0];
}

// Draggable Video Card for bucket view
function DraggableVideoCard({
  video,
  onRemove,
  buckets,
}: {
  video: Video;
  onRemove: (id: string) => void;
  buckets: DripBucketType[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bucket = getBucketForDays(video.drip_days, buckets);

  // Use custom thumbnail if set, otherwise use Mux thumbnail
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
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 mt-3 flex-shrink-0"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        {/* Thumbnail */}
        <Link
          href={`/videos/${video.id}`}
          className="flex-shrink-0 w-20 h-12 rounded overflow-hidden bg-gray-100"
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <span className="text-white/80 text-[10px]">No thumb</span>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/videos/${video.id}`}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
          >
            {video.title}
          </Link>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${bucket.color}`}>
              {bucket.label}
            </span>
            {video.duration_seconds && (
              <span className="text-[10px] text-gray-400">
                {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
              </span>
            )}
            {video.is_free && <span className="text-[10px] text-blue-600 font-medium">Free</span>}
            {!video.is_published && <span className="text-[10px] text-yellow-600 font-medium">Draft</span>}
          </div>
        </div>
        <button
          onClick={() => onRemove(video.id)}
          className="p-1 text-gray-300 hover:text-red-500 flex-shrink-0"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;
  const supabase = createClient();

  const [module, setModule] = useState<Module | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dripBuckets, setDripBuckets] = useState<DripBucketType[]>(DEFAULT_DRIP_BUCKETS);
  const [showBucketSettings, setShowBucketSettings] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchData() {
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (moduleError) {
        setError('Module not found');
        setLoading(false);
        return;
      }

      setModule(moduleData);
      setTitle(moduleData.title);
      setDescription(moduleData.description || '');
      setIsPublished(moduleData.is_published);
      setSortOrder(moduleData.sort_order);
      setCoverImage(moduleData.thumbnail_url);

      // Load drip buckets from database or use defaults
      if (moduleData.drip_buckets && Array.isArray(moduleData.drip_buckets)) {
        setDripBuckets(moduleData.drip_buckets);
      }

      const { data: videosData } = await supabase
        .from('videos')
        .select('id, title, duration_seconds, is_free, is_published, sort_order, mux_playback_id, drip_days, thumbnail_url')
        .eq('module_id', moduleId)
        .order('sort_order');

      setVideos(videosData || []);
      setLoading(false);
    }

    fetchData();
  }, [moduleId, supabase]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('modules')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail_url: coverImage,
          is_published: isPublished,
          sort_order: sortOrder,
          drip_buckets: dripBuckets,
          updated_at: new Date().toISOString(),
        })
        .eq('id', moduleId);

      if (updateError) throw updateError;

      // Show success briefly then redirect
      router.push('/modules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save module');
      setSaving(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!confirm('Remove this video from the module? The video will not be deleted.')) {
      return;
    }

    const { error } = await supabase
      .from('videos')
      .update({ module_id: null })
      .eq('id', videoId);

    if (!error) {
      setVideos(videos.filter((v) => v.id !== videoId));
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
      const fileName = `module-${moduleId}-${Date.now()}.${fileExt}`;

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
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over.id);

      // Reorder the videos array
      const reorderedVideos = arrayMove(videos, oldIndex, newIndex);

      // Get the sorted drip_days values to maintain the same drip schedule pattern
      const sortedDripDays = [...videos]
        .map((v) => v.drip_days || 0)
        .sort((a, b) => a - b);

      // Apply the sorted drip days to the new order
      const newVideos = reorderedVideos.map((video, index) => ({
        ...video,
        sort_order: index,
        drip_days: sortedDripDays[index],
      }));

      setVideos(newVideos);

      // Update sort_order and drip_days in database for all videos
      for (const video of newVideos) {
        await supabase
          .from('videos')
          .update({
            sort_order: video.sort_order,
            drip_days: video.drip_days,
          })
          .eq('id', video.id);
      }
    }
  };

  const handleDripChange = async (videoId: string, days: number) => {
    // Update local state
    setVideos(videos.map((v) =>
      v.id === videoId ? { ...v, drip_days: days } : v
    ));

    // Update in database
    await supabase
      .from('videos')
      .update({ drip_days: days })
      .eq('id', videoId);
  };

  const handleAutoSetDrip = async (interval: number) => {
    // Auto-set drip days based on video order
    const updatedVideos = videos.map((video, index) => ({
      ...video,
      drip_days: index * interval,
    }));

    setVideos(updatedVideos);

    // Update all videos in database
    for (const video of updatedVideos) {
      await supabase
        .from('videos')
        .update({ drip_days: video.drip_days })
        .eq('id', video.id);
    }
  };

  // Auto-set drip based on bucket configuration
  const handleAutoSetFromBuckets = async () => {
    const sortedBuckets = [...dripBuckets].sort((a, b) => a.days - b.days);
    const videosPerBucket = Math.ceil(videos.length / sortedBuckets.length);

    const updatedVideos = videos.map((video, index) => {
      const bucketIndex = Math.min(Math.floor(index / videosPerBucket), sortedBuckets.length - 1);
      return {
        ...video,
        drip_days: sortedBuckets[bucketIndex].days,
      };
    });

    setVideos(updatedVideos);

    for (const video of updatedVideos) {
      await supabase
        .from('videos')
        .update({ drip_days: video.drip_days })
        .eq('id', video.id);
    }
  };

  const handleAddBucket = () => {
    const lastBucket = dripBuckets[dripBuckets.length - 1];
    const newDays = lastBucket ? lastBucket.days + 7 : 0;
    const usedColors = dripBuckets.map((b) => b.color);
    const availableColor = BUCKET_COLORS.find((c) => !usedColors.includes(c)) || BUCKET_COLORS[0];

    const newBucket: DripBucketType = {
      id: `bucket-${Date.now()}`,
      label: `Day ${newDays}`,
      days: newDays,
      color: availableColor,
    };

    setDripBuckets([...dripBuckets, newBucket].sort((a, b) => a.days - b.days));
  };

  const handleUpdateBucket = (bucketId: string, updates: Partial<DripBucketType>) => {
    setDripBuckets(
      dripBuckets
        .map((b) => (b.id === bucketId ? { ...b, ...updates } : b))
        .sort((a, b) => a.days - b.days)
    );
  };

  const handleRemoveBucket = (bucketId: string) => {
    if (dripBuckets.length <= 1) return;
    setDripBuckets(dripBuckets.filter((b) => b.id !== bucketId));
  };

  if (loading) {
    return (
      <>
        <Header user={null} title="Edit Module" />
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  if (!module) {
    return (
      <>
        <Header user={null} title="Edit Module" />
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            Module not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={null} title="Edit Module" />
      <div className="p-6">
        <Link
          href="/modules"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Modules
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cover Image & Module Details */}
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
                className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  uploadingCover ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
              </label>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Recommended: 16:9 aspect ratio
              </p>
            </div>

            {/* Module Details */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Details</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Published</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => router.push('/modules')}
                  className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
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
          </div>

          {/* Videos in Module */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Videos in Module</h2>
                <Link
                  href={`/videos/upload?module=${moduleId}`}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Video
                </Link>
              </div>

              {videos.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No videos in this module yet.</p>
              ) : (
                <>
                  {/* Drip Timeline with Settings */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Drip Schedule</p>
                      <button
                        onClick={() => setShowBucketSettings(!showBucketSettings)}
                        className={`p-1.5 rounded transition-colors ${
                          showBucketSettings ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="Configure buckets"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bucket Settings Panel */}
                    {showBucketSettings && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="space-y-2">
                          {dripBuckets.map((bucket) => (
                            <div key={bucket.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={bucket.label}
                                onChange={(e) => handleUpdateBucket(bucket.id, { label: e.target.value })}
                                className="flex-1 text-sm px-2 py-1.5 border rounded"
                                placeholder="Label"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Day</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={bucket.days}
                                  onChange={(e) => handleUpdateBucket(bucket.id, { days: parseInt(e.target.value) || 0 })}
                                  className="w-16 text-sm px-2 py-1.5 border rounded"
                                />
                              </div>
                              <div className={`w-5 h-5 rounded border ${bucket.color}`} />
                              {dripBuckets.length > 1 && (
                                <button
                                  onClick={() => handleRemoveBucket(bucket.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          <button
                            onClick={handleAddBucket}
                            className="text-sm px-3 py-1.5 bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Bucket
                          </button>
                          <button
                            onClick={handleAutoSetFromBuckets}
                            className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                          >
                            <Wand2 className="w-4 h-4" />
                            Apply to Videos
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bucket Timeline Visual */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {dripBuckets.map((bucket) => {
                        const bucketVideos = videos.filter((v) => {
                          const d = v.drip_days || 0;
                          const bucketIndex = dripBuckets.findIndex((b) => b.id === bucket.id);
                          const nextBucket = dripBuckets[bucketIndex + 1];
                          return d >= bucket.days && (!nextBucket || d < nextBucket.days);
                        });
                        return (
                          <div
                            key={bucket.id}
                            className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium border ${bucket.color} ${
                              bucketVideos.length > 0 ? 'opacity-100' : 'opacity-40'
                            }`}
                            title={`${bucketVideos.length} video(s) - Day ${bucket.days}`}
                          >
                            {bucket.label}
                            {bucketVideos.length > 0 && (
                              <span className="ml-1.5 bg-white/50 px-1.5 rounded">
                                {bucketVideos.length}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-gray-400">Quick:</span>
                      <button
                        onClick={() => handleAutoSetDrip(7)}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
                      >
                        Weekly
                      </button>
                      <button
                        onClick={() => handleAutoSetDrip(0)}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
                      >
                        All Now
                      </button>
                    </div>
                  </div>

                  {/* Video list */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={videos.map((v) => v.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {videos.map((video) => (
                          <DraggableVideoCard
                            key={video.id}
                            video={video}
                            onRemove={handleRemoveVideo}
                            buckets={dripBuckets}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </>
              )}
              <p className="text-xs text-gray-400 mt-4">
                Drag to reorder • Drip schedule auto-adjusts with order
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
