#!/usr/bin/env node

/**
 * Create Vercel Storage Services via API
 */

const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'EBNjRvcd9r4fg0j6ckw8ybkT';
const PROJECT_ID = 'prj_BVZNoziTIDO1M1YvbidPDbrG8o39';
const TEAM_ID = 'team_vadPQkLibA2prB46EXHZvI1i';

async function makeVercelRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createStorageServices() {
  console.log('🚀 Creating Vercel Storage Services...\n');

  try {
    // Check existing stores
    console.log('📋 Checking existing storage...');
    const stores = await makeVercelRequest(`/v1/stores?teamId=${TEAM_ID}`);
    console.log(`Found ${stores.stores?.length || 0} existing stores\n`);

    // Create Postgres Database
    console.log('📊 Creating PostgreSQL Database...');
    try {
      const postgres = await makeVercelRequest('/v1/stores', 'POST', {
        type: 'postgres',
        name: 'umzugsapp-db',
        region: 'fra1',
        teamId: TEAM_ID
      });
      console.log('✅ PostgreSQL created:', postgres.store.name);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  PostgreSQL already exists');
      } else {
        console.error('❌ PostgreSQL error:', error.message);
      }
    }

    // Create Blob Storage
    console.log('\n📦 Creating Blob Storage...');
    try {
      const blob = await makeVercelRequest('/v1/stores', 'POST', {
        type: 'blob',
        name: 'umzugsapp-files',
        region: 'fra1',
        teamId: TEAM_ID
      });
      console.log('✅ Blob Storage created:', blob.store.name);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Blob Storage already exists');
      } else {
        console.error('❌ Blob error:', error.message);
      }
    }

    // Create KV Store
    console.log('\n🔑 Creating KV Store...');
    try {
      const kv = await makeVercelRequest('/v1/stores', 'POST', {
        type: 'kv',
        name: 'umzugsapp-cache',
        region: 'fra1',
        teamId: TEAM_ID
      });
      console.log('✅ KV Store created:', kv.store.name);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  KV Store already exists');
      } else {
        console.error('❌ KV error:', error.message);
      }
    }

    // Connect stores to project
    console.log('\n🔗 Connecting stores to project...');
    
    // Get updated stores list
    const updatedStores = await makeVercelRequest(`/v1/stores?teamId=${TEAM_ID}`);
    
    for (const store of updatedStores.stores || []) {
      if (store.name.includes('umzugsapp')) {
        try {
          await makeVercelRequest(`/v1/projects/${PROJECT_ID}/stores`, 'POST', {
            storeId: store.id,
            teamId: TEAM_ID
          });
          console.log(`✅ Connected ${store.name} to project`);
        } catch (error) {
          console.log(`⚠️  ${store.name} might already be connected`);
        }
      }
    }

    console.log('\n✨ Storage setup complete!');
    console.log('\nNext step: Pull environment variables');
    console.log('Run: vercel env pull .env.local');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createStorageServices();