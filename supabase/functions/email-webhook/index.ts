import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This webhook can be called by email forwarding services or IFTTT/Zapier
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse incoming email data
    const data = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📧 Received email webhook:', data)

    // Extract email data (format depends on the service sending the webhook)
    const email = {
      message_id: data.message_id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from_email: data.from_email || data.from?.email || data.sender,
      from_name: data.from_name || data.from?.name || '',
      to_email: data.to_email || data.to?.email || data.recipient || 'bielefeld@relocato.de',
      subject: data.subject || '(Kein Betreff)',
      body_text: data.body_text || data.text || data.plain || '',
      body_html: data.body_html || data.html || '',
      date: data.date ? new Date(data.date) : new Date(),
      has_attachments: data.attachments ? data.attachments.length > 0 : false,
      attachments: data.attachments || [],
      headers: data.headers || {},
      folder: 'INBOX'
    }

    // Store email in database
    const { data: insertedEmail, error } = await supabase
      .from('emails')
      .insert(email)
      .select()
      .single()

    if (error) {
      console.error('Failed to store email:', error)
      throw error
    }

    console.log('✅ Email stored successfully:', insertedEmail.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email received and stored',
        email_id: insertedEmail.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Webhook error:', error)
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