import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { ModulesView } from '@/components/ModulesView';

async function getModules() {
  const supabase = await createClient();

  const { data: modules, error } = await supabase
    .from('modules')
    .select(`
      *,
      videos (
        id,
        duration_seconds
      )
    `)
    .order('sort_order');

  if (error) {
    console.error('Error fetching modules:', error);
    return [];
  }

  // Calculate total duration for each module
  return (modules || []).map((module) => ({
    ...module,
    total_duration: module.videos?.reduce(
      (sum: number, v: { duration_seconds: number | null }) => sum + (v.duration_seconds || 0),
      0
    ) || 0,
    total_views: 0, // TODO: Calculate from video_progress when available
  }));
}

export default async function ModulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const modules = await getModules();

  return (
    <>
      <Header user={user} title="Modules" />
      <ModulesView initialModules={modules} />
    </>
  );
}
