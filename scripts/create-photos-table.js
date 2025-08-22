const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
// Using anon key for now - service key would need to be a JWT
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPhotosTable() {
  console.log('Creating customer_photos table...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      -- Create customer_photos table
      CREATE TABLE IF NOT EXISTS public.customer_photos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id UUID NOT NULL,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type TEXT NOT NULL,
          url TEXT NOT NULL,
          thumbnail_url TEXT,
          description TEXT,
          tags TEXT[],
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          uploaded_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_customer_photos_customer_id ON public.customer_photos(customer_id);
      CREATE INDEX IF NOT EXISTS idx_customer_photos_uploaded_at ON public.customer_photos(uploaded_at DESC);
      
      -- Enable Row Level Security
      ALTER TABLE public.customer_photos ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies
      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.customer_photos;
      CREATE POLICY "Allow all operations for authenticated users" ON public.customer_photos
          FOR ALL
          USING (true)
          WITH CHECK (true);
      
      -- Grant permissions
      GRANT ALL ON public.customer_photos TO authenticated;
      GRANT ALL ON public.customer_photos TO service_role;
      GRANT ALL ON public.customer_photos TO anon;
    `
  });
  
  if (error) {
    console.error('Error creating table:', error);
    
    // Try alternative approach directly with admin privileges
    console.log('Trying alternative approach...');
    
    const { data: result, error: altError } = await supabase
      .from('customer_photos')
      .select('count')
      .limit(1);
    
    if (altError && altError.code === '42P01') {
      // Table doesn't exist, try to create it without RPC
      console.log('Table does not exist. Creating via direct SQL...');
      
      // This approach won't work, so we need to use Supabase dashboard
      console.log('Please create the table using Supabase dashboard SQL editor with the following query:');
      console.log(`
        CREATE TABLE IF NOT EXISTS public.customer_photos (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            customer_id UUID NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size BIGINT NOT NULL,
            mime_type TEXT NOT NULL,
            url TEXT NOT NULL,
            thumbnail_url TEXT,
            description TEXT,
            tags TEXT[],
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            uploaded_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else if (!altError) {
      console.log('Table already exists!');
    }
  } else {
    console.log('Table created successfully!');
  }
  
  // Create storage bucket
  console.log('\nCreating storage bucket for customer photos...');
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === 'customer-photos');
  
  if (!bucketExists) {
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('customer-photos', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
    });
    
    if (bucketError) {
      console.error('Error creating bucket:', bucketError);
    } else {
      console.log('Storage bucket created successfully!');
    }
  } else {
    console.log('Storage bucket already exists!');
  }
}

createPhotosTable().catch(console.error);