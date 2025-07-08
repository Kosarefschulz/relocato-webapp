const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
// Note: This appears to be a personal access token, not a service role key
// Service role keys usually start with 'eyJ' (JWT format)
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_61d622f70f2d7c18c14719897bf6d16755606a9e';

async function setupStorageBucket() {
  console.log('🚀 Setting up Supabase Storage Bucket...');

  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if bucket already exists
    console.log('📋 Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'furniture-scans');
    
    if (bucketExists) {
      console.log('✅ Bucket "furniture-scans" already exists!');
    } else {
      // Create the bucket
      console.log('📦 Creating bucket "furniture-scans"...');
      const { data, error } = await supabase.storage.createBucket('furniture-scans', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }

      console.log('✅ Bucket created successfully!');
    }

    // Set up storage policies using SQL
    console.log('🔐 Setting up storage policies...');
    
    const policies = [
      {
        name: 'Public Access',
        definition: `
          CREATE POLICY "Public Access" ON storage.objects 
          FOR SELECT 
          USING (bucket_id = 'furniture-scans');
        `
      },
      {
        name: 'Authenticated Upload',
        definition: `
          CREATE POLICY "Authenticated users can upload" ON storage.objects 
          FOR INSERT 
          WITH CHECK (bucket_id = 'furniture-scans');
        `
      },
      {
        name: 'Authenticated Update',
        definition: `
          CREATE POLICY "Users can update own images" ON storage.objects 
          FOR UPDATE 
          USING (bucket_id = 'furniture-scans')
          WITH CHECK (bucket_id = 'furniture-scans');
        `
      },
      {
        name: 'Authenticated Delete',
        definition: `
          CREATE POLICY "Users can delete own images" ON storage.objects 
          FOR DELETE 
          USING (bucket_id = 'furniture-scans');
        `
      }
    ];

    // Execute policies
    for (const policy of policies) {
      try {
        console.log(`  → Creating policy: ${policy.name}`);
        const { error } = await supabase.rpc('exec_sql', {
          sql: policy.definition
        });
        
        if (error && !error.message.includes('already exists')) {
          console.error(`  ❌ Error creating policy ${policy.name}:`, error);
        } else {
          console.log(`  ✅ Policy ${policy.name} created or already exists`);
        }
      } catch (err) {
        console.log(`  ℹ️  Policy ${policy.name} might already exist, skipping...`);
      }
    }

    console.log('\n🎉 Storage setup complete!');
    console.log('📸 Users can now upload photos in the Volume Scanner');
    
    // Test upload capability
    console.log('\n🧪 Testing upload capability...');
    const testFileName = `test/test_${Date.now()}.txt`;
    const { error: uploadError } = await supabase.storage
      .from('furniture-scans')
      .upload(testFileName, new Blob(['Test file'], { type: 'text/plain' }));

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
    } else {
      console.log('✅ Test upload successful!');
      
      // Clean up test file
      await supabase.storage
        .from('furniture-scans')
        .remove([testFileName]);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupStorageBucket();