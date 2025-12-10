'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { Save, Trash2, Play, ArrowLeft, Upload, X, Pause } from 'lucide-react';
import Link from 'next/link';

interface Module {
  id: string;
  title: string;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  module_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_free: boolean;
  is_published: boolean;
  sort_order: number;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  created_at: string;
}

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;
  const supabase = createClient();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      // Fetch video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError) {
        setError('Video not found');
        setLoading(false);
        return;
      }

      setVideo(videoData);
      setTitle(videoData.title);
      setDescription(videoData.description || '');
      setModuleId(videoData.module_id || '');
      setIsFree(videoData.is_free);
      setIsPublished(videoData.is_published);
      setSortOrder(videoData.sort_order);
      setCustomThumbnail(videoData.thumbnail_url);

      // Fetch modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title')
        .order('sort_order');

      setModules(modulesData || []);
      setLoading(false);
    }

    fetchData();
  }, [videoId, supabase]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          module_id: moduleId || null,
          thumbnail_url: customThumbnail,
          is_free: isFree,
          is_published: isPublished,
          sort_order: sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      if (updateError) throw updateError;

      router.push('/videos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save video');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) throw deleteError;

      router.push('/videos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
      setDeleting(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingThumbnail(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${videoId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      setCustomThumbnail(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleRemoveThumbnail = () => {
    setCustomThumbnail(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  // Generate Mux thumbnail URL (used as fallback if no custom thumbnail)
  const muxThumbnailUrl = video?.mux_playback_id
    ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`
    : null;

  // Use custom thumbnail if set, otherwise use Mux thumbnail
  const displayThumbnailUrl = customThumbnail || muxThumbnailUrl;

  // Generate Mux animated GIF URL for preview
  const gifUrl = video?.mux_playback_id
    ? `https://image.mux.com/${video.mux_playback_id}/animated.gif?width=320&start=0&end=5`
    : null;

  // Generate Mux HLS stream URL for video playback
  const videoStreamUrl = video?.mux_playback_id
    ? `https://stream.mux.com/${video.mux_playback_id}.m3u8`
    : null;

  const handlePlayVideo = () => {
    setShowVideoPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowVideoPlayer(false);
  };

  if (loading) {
    return (
      <>
        <Header user={null} title="Edit Video" />
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header user={null} title="Edit Video" />
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            Video not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={null} title="Edit Video" />
      <div className="p-6">
        <Link
          href="/videos"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Videos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-1">
            {/* Video Player Section */}
            {videoStreamUrl && (
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Preview</h2>

                {showVideoPlayer ? (
                  <div className="relative">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={`https://player.mux.com/${video.mux_playback_id}?autoplay=true`}
                        className="w-full h-full"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <button
                      onClick={handleClosePlayer}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
                      title="Close player"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
                    onClick={handlePlayVideo}
                  >
                    {displayThumbnailUrl ? (
                      <img
                        src={displayThumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-black ml-1" />
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {showVideoPlayer ? 'Click X to close player' : 'Click to play video'}
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thumbnail</h2>

              {displayThumbnailUrl ? (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <img
                    src={displayThumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {customThumbnail && (
                    <button
                      onClick={handleRemoveThumbnail}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Remove custom thumbnail"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <Play className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Thumbnail Upload */}
              <div className="mb-4">
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    uploadingThumbnail ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingThumbnail ? 'Uploading...' : 'Upload Custom Thumbnail'}
                </label>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {customThumbnail ? 'Custom thumbnail set' : 'Using auto-generated thumbnail'}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-gray-900">
                    {video.duration_seconds
                      ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}`
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mux Asset</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {video.mux_asset_id?.slice(0, 12) || 'N/A'}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {gifUrl && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Animated Preview</p>
                  <img
                    src={gifUrl}
                    alt="Preview"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Details</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-6">
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
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module
                  </label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No module (standalone)</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first within a module
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isFree}
                        onChange={(e) => setIsFree(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Free video</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Available without subscription
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Published</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Visible to users in the app
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Video'}
                </button>

                <div className="flex space-x-4">
                  <button
                    onClick={() => router.push('/videos')}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
