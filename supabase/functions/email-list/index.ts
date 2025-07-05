import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Get IONOS credentials
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD')
    const IONOS_IMAP_HOST = Deno.env.get('IONOS_IMAP_HOST') || 'imap.ionos.de'
    const IONOS_IMAP_PORT = parseInt(Deno.env.get('IONOS_IMAP_PORT') || '993')

    if (!IONOS_PASSWORD) {
      throw new Error('IONOS_PASSWORD not configured')
    }

    console.log(`📧 Fetching emails from ${folder}...`)

    // For now, return mock data until we implement full IMAP
    // In production, you would use an IMAP library here
    const mockEmails = [
      {
        uid: '1',
        id: '1',
        from: { name: 'Test Sender', address: 'test@example.com' },
        to: [{ address: IONOS_EMAIL }],
        subject: 'Willkommen bei Relocato!',
        date: new Date().toISOString(),
        body: 'Dies ist eine Test-E-Mail.',
        flags: ['\\Seen'],
        folder: folder
      }
    ]

    return new Response(
      JSON.stringify({ 
        success: true,
        emails: mockEmails,
        total: mockEmails.length,
        page: page,
        limit: limit
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error listing emails:', error)
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