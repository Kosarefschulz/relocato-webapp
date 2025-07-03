import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

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
    const { to, subject, content, config, attachments }: EmailRequest = await req.json()
    
    console.log('📧 Sending email via IONOS SMTP...', { to, subject })
    
    const client = new SmtpClient()
    
    // Connect to IONOS SMTP server
    await client.connectTLS({
      hostname: config.host,
      port: config.port,
      username: config.user,
      password: config.pass,
    })
    
    // Send email
    await client.send({
      from: config.from,
      to: to,
      subject: subject,
      content: content,
      html: content,
    })
    
    await client.close()
    
    console.log('✅ Email sent successfully')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email sent successfully' 
    }), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})