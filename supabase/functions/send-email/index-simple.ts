import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content, html } = await req.json()

    // Get credentials
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD')

    if (!IONOS_PASSWORD) {
      throw new Error('IONOS_PASSWORD not configured')
    }

    // Create SMTP client
    const client = new SmtpClient()

    // Configure connection
    const connectConfig = {
      hostname: "smtp.ionos.de",
      port: 587,
      username: IONOS_EMAIL,
      password: IONOS_PASSWORD,
    }

    console.log('Connecting to IONOS SMTP...')
    await client.connectTLS(connectConfig)

    // Send email
    await client.send({
      from: IONOS_EMAIL,
      to: typeof to === 'string' ? to : to.join(','),
      subject: subject,
      content: html || content,
      html: html ? html : undefined,
    })

    await client.close()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully' 
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