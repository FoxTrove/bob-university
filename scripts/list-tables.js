require('dotenv').config();
const https = require('https');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const url = `${supabaseUrl}/rest/v1/`;

const options = {
  headers: {
    'apikey': supabaseAnonKey,
    'Accept': 'application/json'
  }
};

https.get(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const schema = JSON.parse(data);
    const paths = schema.paths || {};
    const tables = Object.keys(paths)
      .filter(path => path !== '/' && path.startsWith('/'))
      .map(path => path.substring(1));

    console.log('Bob University - Supabase Database Status\n');
    console.log('Project Reference:', supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1]);
    console.log('Connection Status: ✓ Connected\n');

    if (tables.length === 0) {
      console.log('Tables found: 0');
      console.log('\nThe database is currently empty (no tables in public schema).');
      console.log('This is a fresh Supabase project ready for schema creation.');
    } else {
      console.log(`Tables found: ${tables.length}`);
      console.log('\nPublic schema tables:');
      tables.forEach(table => console.log(`  - ${table}`));
    }
  });
}).on('error', (err) => {
  console.error('Connection error:', err.message);
});
