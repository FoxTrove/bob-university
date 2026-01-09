'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Trash2, Play, Upload, X, FileText, Loader2 } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';

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
  transcript: string | null;
  type: 'video' | 'text';
  text_content: string | null;
  created_at: string;
}

interface Module {
  id: string;
  title: string;
}

interface LessonEditorProps {
    video: Video;
    onSave: () => void;
    onCancel: () => void;
    onDelete?: () => void; // Optional if we want to allow delete from modal
    isModal?: boolean; // To adjust styling if needed
}

export function LessonEditor({ video, onSave, onCancel, onDelete, isModal = false }: LessonEditorProps) {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

  // Form state initialized from passed video
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || '');
  const [moduleId, setModuleId] = useState(video.module_id || '');
  const [isFree, setIsFree] = useState(video.is_free);
  const [isPublished, setIsPublished] = useState(video.is_published);
  const [sortOrder, setSortOrder] = useState(video.sort_order);
  const [transcript, setTranscript] = useState(video.transcript || '');
  const [textContent, setTextContent] = useState(video.text_content || '');
  
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(video.thumbnail_url);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Fetch modules on mount
  useEffect(() => {
    async function fetchModules() {
      const { data } = await supabase
        .from('modules')
        .select('id, title')
        .order('sort_order');
      setModules(data || []);
    }
    fetchModules();
  }, [supabase]);

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
          transcript: transcript.trim() || null,
          updated_at: new Date().toISOString(),
          text_content: textContent,
        })
        .eq('id', video.id);

      if (updateError) throw updateError;
      
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save video');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (deleteError) throw deleteError;

      onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
      setDeleting(false);
    }
  };

  const handleFetchTranscript = async () => {
    if (!video?.mux_playback_id) return;
    
    setFetchingTranscript(true);
    setError(null);
    
    try {
        const response = await fetch('/api/mux/transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                playbackId: video.mux_playback_id,
                videoId: video.id
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch transcript');
        }
        
        if (data.transcript) {
            setTranscript(data.transcript);
        }
        
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
    } finally {
        setFetchingTranscript(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingThumbnail(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${video.id}-${Date.now()}.${fileExt}`;

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

  // Generate Mux URLs
  const muxThumbnailUrl = video?.mux_playback_id
    ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`
    : null;
  const displayThumbnailUrl = customThumbnail || muxThumbnailUrl;
  const gifUrl = video?.mux_playback_id
    ? `https://image.mux.com/${video.mux_playback_id}/animated.gif?width=320&start=0&end=5`
    : null;
  const videoStreamUrl = video?.mux_playback_id
    ? `https://stream.mux.com/${video.mux_playback_id}.m3u8`
    : null;

  // Layout Components
  const LeftColumn = (
    <div className="lg:col-span-1 space-y-6">
      {/* Video Preview */}
      {video.type === 'video' && (
      <div>
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
                  onClick={() => setShowVideoPlayer(false)}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
                  title="Close player"
                  >
                  <X className="w-4 h-4" />
                  </button>
              </div>
              ) : (
              <div
                  className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setShowVideoPlayer(true)}
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
          </div>
          )}
      </div>
      )}
      
      {/* Text Type Indicator */}
      {video.type === 'text' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Text Section</h3>
            </div>
        </div>
      )}

      {/* Thumbnail Manager */}
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
                  {video.type === 'video' ? <Play className="w-12 h-12 text-gray-400" /> : <FileText className="w-12 h-12 text-gray-400" />}
              </div>
          )}

          <div className="mb-4">
              <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleThumbnailUpload}
              className="hidden"
              id="editor-thumb-upload"
              />
              <label
              htmlFor="editor-thumb-upload"
              className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white text-gray-900 ${
                  uploadingThumbnail ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingThumbnail ? 'Uploading...' : 'Upload Custom Thumbnail'}
              </label>
          </div>
          
          {/* Stats */}
          <div className="space-y-2 text-sm mt-4 pt-4 border-t">
              <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="text-gray-900">
                  {video.duration_seconds
                  ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}`
                  : 'Unknown'}
              </span>
              </div>
              {video.mux_asset_id && (
              <div className="flex justify-between">
                  <span className="text-gray-500">Mux Asset</span>
                  <span className="text-gray-900 font-mono text-xs">
                      {video.mux_asset_id.slice(0, 12)}...
                  </span>
              </div>
              )}
          </div>
      </div>
    </div>
  );

  const FormFields = (
    <div className="space-y-6">
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
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

        {/* Text Content Editor */}
        <div className="md:col-span-2 space-y-2">
        <RichTextEditor
            label="Lesson Content / Notes"
            value={textContent}
            onChange={setTextContent}
        />
        <p className="text-xs text-gray-500">
            Formatted text content, show notes, or transcript.
        </p>
        </div>
        
        {video.type === 'video' && (
        <div>
        <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
                Transcript
            </label>
            <button 
                type="button"
                onClick={handleFetchTranscript}
                disabled={fetchingTranscript || !video?.mux_playback_id}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
                {fetchingTranscript ? 'Fetching...' : 'Fetch from Mux'}
            </button>
        </div>
        <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white text-gray-900"
            placeholder="Enter transcript or WebVTT content..."
        />
        </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Module
            </label>
            <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
            </div>
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
  );

  const FooterButtons = (
      <>
        {onDelete && (
            <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 bg-white"
            >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
            </button>
        )}
        <div className="flex space-x-4 ml-auto">
            <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
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
      </>
  );

  if (isModal) {
    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {LeftColumn}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lesson Details</h2>
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                                {error}
                                </div>
                            )}
                            {FormFields}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-between z-10 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {FooterButtons}
            </div>
        </div>
    );
  }

  // Full Page Layout
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {LeftColumn}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lesson Details</h2>
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                    </div>
                )}
                
                {FormFields}

                <div className="mt-8 pt-6 border-t flex justify-between">
                    {FooterButtons}
                </div>
            </div>
        </div>
    </div>
  );
}
