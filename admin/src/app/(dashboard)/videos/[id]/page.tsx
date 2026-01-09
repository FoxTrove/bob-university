'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { Save, Trash2, Play, ArrowLeft, Upload, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { RichTextEditor } from '@/components/RichTextEditor';
import { LessonEditor } from '@/components/LessonEditor';

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
  transcript: string | null;
  type: 'video' | 'text';
  text_content: string | null;
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
  const [transcript, setTranscript] = useState('');
  const [textContent, setTextContent] = useState('');
  const [fetchingTranscript, setFetchingTranscript] = useState(false);

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
      setTranscript(videoData.transcript || '');
      setTextContent(videoData.text_content || '');

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


  const handleSave = () => {
    router.push('/videos');
  };

  const handleDelete = () => {
    router.push('/videos');
  };

  if (loading) {
    return (
      <>
        <Header user={null} title="Edit Lesson" />
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header user={null} title="Edit Lesson" />
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            Lesson not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={null} title="Edit Lesson" />
      <div className="p-6">
        <Link
          href="/videos"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Lessons
        </Link>
        <LessonEditor 
            video={video} 
            onSave={handleSave} 
            onCancel={() => router.back()} 
            onDelete={handleDelete}
        />
      </div>
    </>
  );
}
