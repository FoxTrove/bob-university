'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

interface Module {
  id: string;
  title: string;
}

export default function UploadVideoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [dripDelayDays, setDripDelayDays] = useState(0);

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [saving, setSaving] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setError(null);
      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
      }
    }
  };

  const uploadToMux = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setError(null);

    try {
      // Get upload URL from our API
      const urlResponse = await fetch('/api/mux/upload-url', {
        method: 'POST',
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, uploadId } = await urlResponse.json();

      // Upload file directly to Mux
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          setUploadStatus('processing');
          // Poll for asset creation
          pollForAsset(uploadId);
        } else {
          setUploadStatus('error');
          setError('Upload failed');
        }
      };

      xhr.onerror = () => {
        setUploadStatus('error');
        setError('Upload failed');
      };

      xhr.send(file);
    } catch (err) {
      setUploadStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const pollForAsset = async (uploadId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const response = await fetch(`/api/mux/upload-status?uploadId=${uploadId}`);
        const data = await response.json();

        if (data.status === 'asset_created' && data.playbackId) {
          setMuxAssetId(data.assetId);
          setMuxPlaybackId(data.playbackId);
          setDuration(data.duration ? Math.round(data.duration) : null);
          setUploadStatus('ready');
        } else if (data.status === 'errored') {
          setUploadStatus('error');
          setError('Video processing failed');
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setUploadStatus('error');
          setError('Processing timed out');
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setUploadStatus('error');
          setError('Failed to check processing status');
        }
      }
    };

    poll();
  };

  const handleSave = async () => {
    if (!title || !muxPlaybackId) {
      setError('Please fill in required fields and complete video upload');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('videos').insert({
        title,
        description: description || null,
        module_id: moduleId || null,
        video_url: `https://stream.mux.com/${muxPlaybackId}.m3u8`,
        mux_asset_id: muxAssetId,
        mux_playback_id: muxPlaybackId,
        duration_seconds: duration,
        is_free: isFree,
        is_published: isPublished,
        sort_order: 0,
      });

      if (insertError) throw insertError;

      router.push('/videos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save video');
      setSaving(false);
    }
  };

  const getStatusDisplay = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <div className="flex items-center text-blue-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Uploading... {uploadProgress}%
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center text-yellow-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing video...
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            Ready to save
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error || 'Upload failed'}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header user={null} title="Upload Video" />
      <div className="p-6 max-w-3xl">
        <div className="bg-white rounded-lg shadow p-6">
          {error && uploadStatus !== 'error' && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {/* File Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {!file ? (
                <label className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to select a video file</p>
                  <p className="text-sm text-gray-400">MP4, MOV, or WebM up to 5GB</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div>
                  <p className="text-gray-900 font-medium mb-2">{file.name}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {getStatusDisplay()}
                  {uploadStatus === 'idle' && (
                    <button
                      onClick={uploadToMux}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Upload
                    </button>
                  )}
                  {uploadStatus === 'uploading' && (
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video Details */}
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
                placeholder="Enter video title"
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
                placeholder="Enter video description"
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
                  Available to all users without subscription
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drip Delay (days)
              </label>
              <input
                type="number"
                min="0"
                value={dripDelayDays}
                onChange={(e) => setDripDelayDays(parseInt(e.target.value) || 0)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Days after subscription start before this video unlocks (0 = immediate)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              onClick={() => router.push('/videos')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploadStatus !== 'ready'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Video'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
