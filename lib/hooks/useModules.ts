import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Module, ModuleWithVideos } from '../database.types';

interface UseModulesResult {
  modules: Module[];
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
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('modules')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setModules(data || []);
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

      // Sort videos by sort_order
      if (data?.videos) {
        data.videos.sort((a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
        );
        // Filter to only published videos
        data.videos = data.videos.filter((v: { is_published: boolean }) => v.is_published);
      }

      setModule(data as ModuleWithVideos);
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
