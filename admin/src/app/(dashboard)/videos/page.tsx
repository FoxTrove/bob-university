import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { LessonsList } from '@/components/LessonsList';

async function getVideos() {
  const supabase = await createClient();

  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      *,
      modules (
        id,
        title
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }

  return videos || [];
}

export default async function VideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const videos = await getVideos();

  return (
    <>
      <Header user={user} title="Lessons" />
      <LessonsList initialVideos={videos} />
    </>
  );
}
