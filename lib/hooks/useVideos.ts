import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Video, VideoProgress, VideoWithProgress } from '../database.types';
import { useAuth } from '../auth';

interface UseVideosResult {
  videos: VideoWithProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseVideoResult {
  video: VideoWithProgress | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseVideoProgressResult {
  progress: VideoProgress | null;
  loading: boolean;
  updateProgress: (watchedSeconds: number, durationSeconds: number) => Promise<void>;
  markCompleted: () => Promise<void>;
}

export function useVideos(moduleId: string | undefined): UseVideosResult {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!moduleId) {
      setVideos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch videos for the module
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (videosError) {
        throw videosError;
      }

      // If user is logged in, fetch their progress
      let progressMap: Record<string, VideoProgress> = {};
      if (user?.id && videosData && videosData.length > 0) {
        const videoIds = videosData.map((v) => v.id);
        const { data: progressData } = await supabase
          .from('video_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('video_id', videoIds);

        if (progressData) {
          progressMap = progressData.reduce((acc, p) => {
            acc[p.video_id] = p;
            return acc;
          }, {} as Record<string, VideoProgress>);
        }
      }

      // Merge videos with progress
      const videosWithProgress: VideoWithProgress[] = (videosData || []).map((video) => ({
        ...video,
        video_progress: progressMap[video.id] || null,
      }));

      setVideos(videosWithProgress);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch videos';
      setError(message);
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  }, [moduleId, user?.id]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, loading, error, refetch: fetchVideos };
}

export function useVideo(videoId: string | undefined): UseVideoResult {
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideo = useCallback(async () => {
    if (!videoId) {
      setVideo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .eq('is_published', true)
        .single();

      if (videoError) {
        throw videoError;
      }

      // Fetch progress if user is logged in
      let progress: VideoProgress | null = null;
      if (user?.id) {
        const { data: progressData } = await supabase
          .from('video_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .single();

        progress = progressData;
      }

      setVideo({
        ...videoData,
        video_progress: progress,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch video';
      setError(message);
      console.error('Error fetching video:', err);
    } finally {
      setLoading(false);
    }
  }, [videoId, user?.id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  return { video, loading, error, refetch: fetchVideo };
}

export function useVideoProgress(videoId: string | undefined): UseVideoProgressResult {
  const { user } = useAuth();
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      if (!videoId || !user?.id) {
        setProgress(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('video_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .single();

        setProgress(data);
      } catch {
        // No progress exists yet
        setProgress(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [videoId, user?.id]);

  const updateProgress = useCallback(
    async (watchedSeconds: number, durationSeconds: number) => {
      if (!videoId || !user?.id) return;

      const progressData = {
        user_id: user.id,
        video_id: videoId,
        watched_seconds: watchedSeconds,
        duration_seconds: durationSeconds,
        last_watched_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('video_progress')
        .upsert(progressData, {
          onConflict: 'user_id,video_id',
        })
        .select()
        .single();

      if (!error && data) {
        setProgress(data);
      }
    },
    [videoId, user?.id]
  );

  const markCompleted = useCallback(async () => {
    if (!videoId || !user?.id) return;

    const { data, error } = await supabase
      .from('video_progress')
      .upsert(
        {
          user_id: user.id,
          video_id: videoId,
          completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,video_id',
        }
      )
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
    }
  }, [videoId, user?.id]);

  return { progress, loading, updateProgress, markCompleted };
}
