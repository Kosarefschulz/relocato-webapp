import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Get proxy URL from environment or use default
    const PROXY_URL = Deno.env.get('EMAIL_PROXY_URL') || 'http://localhost:3001'
    
    console.log(`📧 Fetching emails via proxy from ${folder}...`)

    // Call the proxy server
    const response = await fetch(`${PROXY_URL}/api/emails/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder, page, limit })
    })

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Proxy error:', error)
    
    // If proxy is not available, return helpful message
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Email proxy server not reachable. Please ensure the proxy server is running.',
        setupInstructions: 'See /email-proxy-server/README.md for setup instructions'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})