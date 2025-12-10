// Quick script to verify seed data was inserted
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lwofrjklqmanklbmbsgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b2ZyamtscW1hbmtsYm1ic2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODE3OTEsImV4cCI6MjA4MDM1Nzc5MX0.6FTtWYg8ebfqBSsfNydZkQZxokyTy_K5xTzec22FuD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Checking seed data...\n');

  // Check modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, is_published')
    .order('sort_order');

  if (modulesError) {
    console.error('Error fetching modules:', modulesError.message);
    return;
  }

  console.log(`Found ${modules.length} modules:`);
  modules.forEach(m => console.log(`  - ${m.title} (published: ${m.is_published})`));

  // Check videos
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, title, is_free, is_published, module_id')
    .order('sort_order');

  if (videosError) {
    console.error('Error fetching videos:', videosError.message);
    return;
  }

  console.log(`\nFound ${videos.length} videos:`);
  const freeCount = videos.filter(v => v.is_free).length;
  const premiumCount = videos.filter(v => !v.is_free).length;
  console.log(`  - ${freeCount} free videos`);
  console.log(`  - ${premiumCount} premium videos`);

  console.log('\n✅ Seed data verified successfully!');
}

verify().catch(console.error);
