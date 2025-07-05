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
    const { to, subject, content, html, attachments } = await req.json()

    // Get credentials
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD')
    const IONOS_SMTP_HOST = Deno.env.get('IONOS_SMTP_HOST') || 'smtp.ionos.de'
    const IONOS_SMTP_PORT = parseInt(Deno.env.get('IONOS_SMTP_PORT') || '587')

    if (!IONOS_PASSWORD) {
      throw new Error('IONOS_PASSWORD not configured')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📧 Sending email via IONOS SMTP...')

    // Connect to SMTP
    const conn = await Deno.connectTls({
      hostname: IONOS_SMTP_HOST,
      port: IONOS_SMTP_PORT,
    })

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // Helper to read response
    const readResponse = async () => {
      const buffer = new Uint8Array(1024)
      const n = await conn.read(buffer)
      return decoder.decode(buffer.subarray(0, n || 0))
    }

    // Helper to send command
    const sendCommand = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + '\r\n'))
      return await readResponse()
    }

    // SMTP conversation
    let response = await readResponse()
    console.log('Server greeting:', response)

    response = await sendCommand(`EHLO ${IONOS_SMTP_HOST}`)
    response = await sendCommand(`AUTH LOGIN`)
    response = await sendCommand(btoa(IONOS_EMAIL))
    response = await sendCommand(btoa(IONOS_PASSWORD))

    if (!response.includes('235')) {
      throw new Error('SMTP authentication failed')
    }

    // Send email
    await sendCommand(`MAIL FROM:<${IONOS_EMAIL}>`)
    const recipients = Array.isArray(to) ? to : [to]
    for (const recipient of recipients) {
      await sendCommand(`RCPT TO:<${recipient}>`)
    }

    await sendCommand('DATA')

    // Email headers and body
    const emailData = [
      `From: ${IONOS_EMAIL}`,
      `To: ${recipients.join(', ')}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).substr(2, 9)}@relocato.de>`,
      'MIME-Version: 1.0',
      html ? 'Content-Type: text/html; charset=UTF-8' : 'Content-Type: text/plain; charset=UTF-8',
      '',
      html || content
    ].join('\r\n')

    await conn.write(encoder.encode(emailData + '\r\n.\r\n'))
    response = await readResponse()

    await sendCommand('QUIT')
    conn.close()

    console.log('✅ Email sent successfully')

    // Store sent email in database
    const sentEmail = {
      message_id: `${Date.now()}.${Math.random().toString(36).substr(2, 9)}@relocato.de`,
      from_email: IONOS_EMAIL,
      from_name: 'Relocato',
      to_email: recipients[0], // Store first recipient
      subject: subject,
      body_text: content || '',
      body_html: html || '',
      date: new Date(),
      folder: 'Sent',
      is_read: true,
      has_attachments: attachments ? attachments.length > 0 : false,
      attachments: attachments || []
    }

    const { error: dbError } = await supabase
      .from('emails')
      .insert(sentEmail)

    if (dbError) {
      console.error('Failed to store sent email:', dbError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent and stored successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
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