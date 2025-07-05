import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { folder = 'INBOX', page = 1, limit = 50 } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`📧 Fetching emails from database (${folder})...`)

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Get total count
    const { count } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('folder', folder)

    // Fetch emails
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .eq('folder', folder)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Transform to match expected format
    const transformedEmails = (emails || []).map(email => ({
      id: email.id,
      uid: email.id,
      from: {
        name: email.from_name || '',
        address: email.from_email
      },
      to: [{
        address: email.to_email
      }],
      subject: email.subject || '(Kein Betreff)',
      date: email.date,
      body: email.body_text || '',
      text: email.body_text || '',
      html: email.body_html,
      flags: email.is_read ? ['\\Seen'] : [],
      folder: email.folder,
      preview: (email.body_text || '').substring(0, 100)
    }))

    return new Response(
      JSON.stringify({ 
        success: true,
        emails: transformedEmails,
        total: count || 0,
        page: page,
        limit: limit
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})