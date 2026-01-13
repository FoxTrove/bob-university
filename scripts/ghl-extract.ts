import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const GHL_API_KEY = process.env.GOHIGHLEVEL_API_KEY;
const LOCATION_ID = '3VpW3RGls3jMqf7MzgBK'; // From user URL
const COURSE_ID = 'd8c87981-9177-466e-9747-971f1bbd09c6'; // From user URL

const OUTPUT_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ghl_course_data.json');

if (!GHL_API_KEY) {
  console.error('Error: GOHIGHLEVEL_API_KEY not found in .env');
  process.exit(1);
}

const API_BASE = 'https://services.leadconnectorhq.com'; 

// Helper to ensure locationId is in query
const addLoc = (url: string) => url.includes('?') ? `${url}&locationId=${LOCATION_ID}` : `${url}?locationId=${LOCATION_ID}`;

const headers = {
  Authorization: `Bearer ${GHL_API_KEY}`,
  Version: '2021-07-28',
  Accept: 'application/json',
  'Location-Id': LOCATION_ID
};

async function tryEndpoint(name: string, url: string) {
  try {
    console.log(`Attempting ${name}: ${url}`);
    const response = await axios.get(url, { headers });
    console.log(`SUCCESS [${name}]:`, response.status);
    return response.data;
  } catch (error: any) {
     const status = error.response ? error.response.status : 'Unknown';
     const msg = error.response ? JSON.stringify(error.response.data) : error.message;
     console.log(`FAILED [${name}]: ${status} - ${msg}`);
     return null;
  }
}

async function main() {
  console.log(`--- Starting GHL API Scope Probe ---`);
  console.log(`Key Type: ${GHL_API_KEY.substring(0, 4)}...`);
  console.log(`Location: ${LOCATION_ID}`);

  const probes = [
    { name: 'Location (Auth Check)', url: `/locations/${LOCATION_ID}` },
    { name: 'Contacts (Scope Check)', url: `/contacts` },
    { name: 'Opportunities (Scope Check)', url: `/opportunities/search` },
    { name: 'Users (Scope Check)', url: `/users/` }, // generic list might fail, but let's see
    { name: 'Products (Courses?)', url: `/products` },
    { name: 'Courses (Direct)', url: `/courses` },
    { name: 'Workflows', url: `/workflows/` },
  ];

  for (const probe of probes) {
      await tryEndpoint(probe.name, addLoc(`${API_BASE}${probe.url}`));
  }

  // 3. Try to fetch the specific ID if we find a working base endpoint
  // (Logic requires finding a working list endpoint first to be safe, or just guessing)
}

main();
