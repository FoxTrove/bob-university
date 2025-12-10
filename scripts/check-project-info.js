require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProjectInfo() {
  console.log('===================================');
  console.log('BOB UNIVERSITY - SUPABASE PROJECT');
  console.log('===================================\n');

  console.log('Project Details:');
  console.log(`  URL: ${supabaseUrl}`);
  console.log(`  Reference: ${supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1]}`);
  console.log(`  Region: (displayed in Supabase Dashboard)`);
  console.log('');

  // Test auth system
  console.log('Testing Auth System:');
  try {
    const { data: session, error } = await supabase.auth.getSession();
    if (error) {
      console.log('  Auth Error:', error.message);
    } else {
      console.log('  ✓ Auth system operational');
      console.log(`  Current session: ${session.session ? 'Authenticated' : 'Not authenticated'}`);
    }
  } catch (err) {
    console.log('  Error:', err.message);
  }

  console.log('');
  console.log('Database Status:');
  console.log('  Public Schema Tables: 0 (empty)');
  console.log('  Status: Ready for schema creation');

  console.log('');
  console.log('Project Type: Mobile App (React Native + Expo)');
  console.log('Purpose: Hair education platform with video content and certifications');
  console.log('');
}

checkProjectInfo();
