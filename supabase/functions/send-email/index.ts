import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    console.log('📧 Supabase Edge Function started...')
    
    const requestBody = await req.json()
    console.log('📨 Request body:', JSON.stringify(requestBody, null, 2))
    
    const { to, subject, content } = requestBody
    
    // Get SMTP config from environment variables
    const smtpConfig = {
      host: Deno.env.get('SMTP_HOST') || 'smtp.ionos.de',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      user: Deno.env.get('SMTP_USER') || '',
      pass: Deno.env.get('SMTP_PASS') || '',
      from: Deno.env.get('SMTP_FROM') || ''
    }
    
    console.log('🔧 SMTP Config loaded:', { 
      host: smtpConfig.host, 
      port: smtpConfig.port, 
      user: smtpConfig.user ? '***' : 'missing',
      pass: smtpConfig.pass ? '***' : 'missing',
      from: smtpConfig.from 
    })
    
    // Validate required fields
    if (!to || !subject || !content) {
      throw new Error('Missing required fields: to, subject, or content')
    }
    
    if (!smtpConfig.user || !smtpConfig.pass) {
      throw new Error('SMTP credentials not configured')
    }
    
    // For now, just return success without actually sending
    // This helps us test the configuration first
    console.log('✅ Email would be sent successfully')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`From: ${smtpConfig.from}`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email would be sent successfully (test mode)',
      config: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        from: smtpConfig.from,
        hasCredentials: !!smtpConfig.user && !!smtpConfig.pass
      }
    }), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('❌ Edge Function error:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})