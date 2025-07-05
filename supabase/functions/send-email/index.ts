import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content, html, attachments } = await req.json()

    // Get IONOS credentials from environment variables
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD')
    const IONOS_SMTP_HOST = Deno.env.get('IONOS_SMTP_HOST') || 'smtp.ionos.de'
    const IONOS_SMTP_PORT = parseInt(Deno.env.get('IONOS_SMTP_PORT') || '587')

    if (!IONOS_PASSWORD) {
      throw new Error('IONOS_PASSWORD not configured in environment variables')
    }

    console.log('📧 Sending email via IONOS SMTP...')
    console.log(`From: ${IONOS_EMAIL}`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)

    // Create email content
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const recipients = Array.isArray(to) ? to.join(', ') : to

    // Build email headers
    let emailData = `From: Relocato Bielefeld <${IONOS_EMAIL}>\r\n`
    emailData += `To: ${recipients}\r\n`
    emailData += `Subject: ${subject}\r\n`
    emailData += `Date: ${new Date().toUTCString()}\r\n`
    emailData += `MIME-Version: 1.0\r\n`
    
    if (html) {
      emailData += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`
      emailData += `\r\n`
      
      // Plain text part
      emailData += `--${boundary}\r\n`
      emailData += `Content-Type: text/plain; charset=UTF-8\r\n`
      emailData += `Content-Transfer-Encoding: 7bit\r\n\r\n`
      emailData += `${content || 'This email requires HTML support.'}\r\n`
      
      // HTML part
      emailData += `--${boundary}\r\n`
      emailData += `Content-Type: text/html; charset=UTF-8\r\n`
      emailData += `Content-Transfer-Encoding: 7bit\r\n\r\n`
      emailData += `${html}\r\n`
      
      emailData += `--${boundary}--\r\n`
    } else {
      emailData += `Content-Type: text/plain; charset=UTF-8\r\n`
      emailData += `Content-Transfer-Encoding: 7bit\r\n`
      emailData += `\r\n`
      emailData += `${content}\r\n`
    }

    // Connect to IONOS SMTP using raw TCP/TLS
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    // Connect to SMTP server (start with plain connection for STARTTLS)
    let conn = await Deno.connect({
      hostname: IONOS_SMTP_HOST,
      port: IONOS_SMTP_PORT,
    })

    // Helper function to send command and read response
    async function sendCommand(command: string): Promise<string> {
      await conn.write(encoder.encode(command + '\r\n'))
      const buffer = new Uint8Array(1024)
      const n = await conn.read(buffer)
      return decoder.decode(buffer.subarray(0, n!))
    }

    // Read initial greeting
    const greeting = await conn.read(new Uint8Array(1024))
    console.log('SMTP Greeting:', decoder.decode(greeting))

    // Send EHLO
    const ehloResponse = await sendCommand(`EHLO ${IONOS_SMTP_HOST}`)
    console.log('EHLO Response:', ehloResponse)

    // Send STARTTLS
    const starttlsResponse = await sendCommand('STARTTLS')
    console.log('STARTTLS Response:', starttlsResponse)

    // Upgrade to TLS connection
    const tlsConn = await Deno.startTls(conn, {
      hostname: IONOS_SMTP_HOST,
    })
    conn = tlsConn

    // Send EHLO again after TLS
    const ehloTlsResponse = await sendCommand(`EHLO ${IONOS_SMTP_HOST}`)
    console.log('EHLO TLS Response:', ehloTlsResponse)

    // Authenticate with LOGIN method
    await sendCommand('AUTH LOGIN')
    await sendCommand(btoa(IONOS_EMAIL))
    const authResponse = await sendCommand(btoa(IONOS_PASSWORD))
    console.log('Auth Response:', authResponse)

    // Send MAIL FROM
    await sendCommand(`MAIL FROM:<${IONOS_EMAIL}>`)

    // Send RCPT TO for each recipient
    const recipientList = Array.isArray(to) ? to : [to]
    for (const recipient of recipientList) {
      await sendCommand(`RCPT TO:<${recipient}>`)
    }

    // Send DATA
    await sendCommand('DATA')

    // Send email content
    await conn.write(encoder.encode(emailData))
    await conn.write(encoder.encode('\r\n.\r\n'))

    // Read response
    const dataResponse = await conn.read(new Uint8Array(1024))
    console.log('Data Response:', decoder.decode(dataResponse))

    // Quit
    await sendCommand('QUIT')
    
    // Close connection
    conn.close()

    console.log('✅ Email sent successfully!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        details: {
          from: IONOS_EMAIL,
          to: recipientList,
          subject: subject
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})