#!/usr/bin/env ts-node

const { createClient } = require('@supabase/supabase-js');

export {}; // Make this a module

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

async function testConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      process.exit(1);
    }
    console.log('✅ Supabase connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    process.exit(1);
  }
}

testConnection();