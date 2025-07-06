import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { folder = 'INBOX', page = 1, limit = 50 } = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`📊 Fetching emails from database for folder: ${folder}, page: ${page}, limit: ${limit}`)

    // Calculate offset
    const offset = (page - 1) * limit

    // Get total count
    const { count } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('folder', folder)

    // Get emails
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .eq('folder', folder)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Transform to expected format
    const transformedEmails = (emails || []).map(email => ({
      id: email.uid,
      uid: email.uid,
      from: {
        address: email.from_address,
        name: email.from_name || ''
      },
      to: email.to_addresses || [],
      cc: email.cc_addresses || [],
      bcc: email.bcc_addresses || [],
      subject: email.subject || '',
      date: email.date,
      flags: email.flags || [],
      text: email.text_content,
      html: email.html_content,
      body: email.text_content || '', // For compatibility
      attachments: email.attachments || [],
      size: email.size,
      messageId: email.message_id,
      inReplyTo: email.in_reply_to,
      references: email.references,
      folder: email.folder,
      preview: (email.text_content || '').substring(0, 100)
    }))

    console.log(`✅ Found ${transformedEmails.length} emails in database`)

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
    console.error('Error fetching emails from database:', error)
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