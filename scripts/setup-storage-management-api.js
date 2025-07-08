const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const SUPABASE_PROJECT_REF = 'kmxipuaqierjqaikuimi'; // Extracted from URL
const SUPABASE_ACCESS_TOKEN = 'sbp_61d622f70f2d7c18c14719897bf6d16755606a9e';
const SUPABASE_API_URL = 'https://api.supabase.com';

async function setupStorageBucket() {
  console.log('🚀 Setting up Supabase Storage Bucket via Management API...');

  try {
    // First, list existing buckets
    console.log('📋 Checking existing buckets...');
    const listResponse = await fetch(`${SUPABASE_API_URL}/v1/projects/${SUPABASE_PROJECT_REF}/storage/buckets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error('❌ Error listing buckets:', error);
      return;
    }

    const buckets = await listResponse.json();
    console.log('📦 Existing buckets:', buckets.map(b => b.name).join(', ') || 'None');

    const bucketExists = buckets.some(bucket => bucket.name === 'furniture-scans');

    if (bucketExists) {
      console.log('✅ Bucket "furniture-scans" already exists!');
    } else {
      // Create the bucket
      console.log('📦 Creating bucket "furniture-scans"...');
      const createResponse = await fetch(`${SUPABASE_API_URL}/v1/projects/${SUPABASE_PROJECT_REF}/storage/buckets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'furniture-scans',
          name: 'furniture-scans',
          public: true,
          file_size_limit: 5242880, // 5MB
          allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('❌ Error creating bucket:', error);
        return;
      }

      console.log('✅ Bucket created successfully!');
    }

    // Update bucket policies
    console.log('🔐 Setting up storage policies...');
    
    const policyUpdates = {
      SELECT: 'true', // Public access
      INSERT: 'auth.role() = \'authenticated\'', // Authenticated users can upload
      UPDATE: 'auth.role() = \'authenticated\'', // Authenticated users can update
      DELETE: 'auth.role() = \'authenticated\'' // Authenticated users can delete
    };

    for (const [action, policy] of Object.entries(policyUpdates)) {
      console.log(`  → Updating ${action} policy...`);
      const policyResponse = await fetch(`${SUPABASE_API_URL}/v1/projects/${SUPABASE_PROJECT_REF}/storage/buckets/furniture-scans/policies/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          definition: policy
        })
      });

      if (!policyResponse.ok && policyResponse.status !== 404) {
        const error = await policyResponse.text();
        console.warn(`  ⚠️  Warning updating ${action} policy:`, error);
      } else {
        console.log(`  ✅ ${action} policy updated`);
      }
    }

    console.log('\n🎉 Storage setup complete!');
    console.log('📸 Users can now upload photos in the Volume Scanner');
    
    // Show bucket URL
    console.log(`\n📍 Bucket URL: https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/furniture-scans/`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupStorageBucket();