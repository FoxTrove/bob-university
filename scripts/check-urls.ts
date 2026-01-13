import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import 'dotenv/config';

const CSV_FILE_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');

async function checkUrls() {
  console.log('Checking URL validity for failed videos...');
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

  // Focus on likely problem ones (m3u8 or ones user mentioned like French Bob part 5)
  // French Bob Part 5 corresponds to record with Course Name="French Bob part 5"
  
  const targetVideos = records.filter((r: any) => 
    r['Course Name'].includes('French Bob') || 
    r['Video Link'].includes('.m3u8')
  );

  for (const record of targetVideos) {
    const title = record['Course Name'];
    const url = record['Video Link'];
    
    console.log(`Checking [${title}]: ${url}`);
    
    try {
      // Just check HEAD or GET first bytes
      const response = await axios.head(url);
      console.log(`  - Status: ${response.status} ${response.statusText}`);
      console.log(`  - Content-Type: ${response.headers['content-type']}`);
    } catch (err: any) {
      console.error(`  - ERROR: ${err.message} (Status: ${err.response?.status})`);
    }
  }
}

checkUrls();
