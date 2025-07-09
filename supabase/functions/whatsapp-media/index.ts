import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = 'IAZJrrEVUymetKybaO6p83rQAK'
    const BASE_URL = 'https://waba-v2.360dialog.io/v1'
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get request body
    const { media_id } = await req.json()
    
    if (!media_id) {
      throw new Error('media_id is required')
    }

    // Check if we have it cached
    const { data: cachedMedia } = await supabase
      .from('whatsapp_media')
      .select('*')
      .eq('media_id', media_id)
      .single()

    if (cachedMedia && cachedMedia.storage_path) {
      // Return cached URL
      const { data: { publicUrl } } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(cachedMedia.storage_path)

      return new Response(
        JSON.stringify({ url: publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get media URL from WhatsApp
    const mediaResponse = await fetch(`${BASE_URL}/media/${media_id}`, {
      headers: {
        'D360-API-KEY': API_KEY,
      },
    })

    if (!mediaResponse.ok) {
      throw new Error('Failed to get media info')
    }

    const mediaInfo = await mediaResponse.json()

    // Download media
    const downloadResponse = await fetch(mediaInfo.url, {
      headers: {
        'D360-API-KEY': API_KEY,
      },
    })

    if (!downloadResponse.ok) {
      throw new Error('Failed to download media')
    }

    const mediaBlob = await downloadResponse.blob()
    const arrayBuffer = await mediaBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const fileName = `${media_id}_${Date.now()}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('whatsapp-media')
      .upload(fileName, uint8Array, {
        contentType: mediaInfo.mime_type,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('whatsapp-media')
      .getPublicUrl(fileName)

    // Save media reference
    await supabase
      .from('whatsapp_media')
      .insert({
        media_id,
        mime_type: mediaInfo.mime_type,
        sha256: mediaInfo.sha256,
        file_size: mediaInfo.file_size,
        storage_path: fileName,
        download_url: publicUrl,
      })

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})