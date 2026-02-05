import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { ModuleWithVideos, ModuleWithProgress, VideoMinimal, Module, Video } from '../database.types';

interface UseModulesResult {
  modules: ModuleWithProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseModuleResult {
  module: ModuleWithVideos | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useModules(): UseModulesResult {
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      // Fetch modules with their videos
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          videos (
            id,
            duration_seconds,
            is_published
          )
        `)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (modulesError) throw modulesError;

      // If user is logged in, fetch their progress
      let progressMap = new Map<string, boolean>();
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('video_progress')
          .select('video_id, completed')
          .eq('user_id', user.id)
          .eq('completed', true);

        if (progressError) throw progressError;

        if (progressData) {
          progressData.forEach(p => progressMap.set(p.video_id, true));
        }
      }

      // Process modules to add progress stats
      type ModuleWithMinimalVideos = Module & { videos: VideoMinimal[] | null };
      const modulesWithProgress = (modulesData as ModuleWithMinimalVideos[] || []).map((module) => {
        const videos = (module.videos || []).filter((v) => v.is_published);
        const totalVideos = videos.length;
        const completedVideos = videos.filter((v) => progressMap.has(v.id)).length;
        const progressPercent = totalVideos > 0 
          ? Math.round((completedVideos / totalVideos) * 100) 
          : 0;

        return {
          ...module,
          videos, // We keep the minimal video data here
          totalVideos,
          completedVideos,
          progressPercent
        };
      });

      setModules(modulesWithProgress);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch modules';
      setError(message);
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return { modules, loading, error, refetch: fetchModules };
}

export function useModule(moduleId: string | undefined): UseModuleResult {
  const [module, setModule] = useState<ModuleWithVideos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModule = useCallback(async () => {
    if (!moduleId) {
      setModule(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('modules')
        .select(`
          *,
          videos (
            *
          )
        `)
        .eq('id', moduleId)
        .eq('is_published', true)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Sort and filter videos
      let videos: Video[] = data?.videos || [];
      videos = videos
        .filter((v) => v.is_published)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      setModule({ ...data, videos } as ModuleWithVideos);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch module';
      setError(message);
      console.error('Error fetching module:', err);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  return { module, loading, error, refetch: fetchModule };
}
