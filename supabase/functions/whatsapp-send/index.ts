import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = 'IAZJrrEVUymetKybaO6p83rQAK'
    const BASE_URL = 'https://waba-v2.360dialog.io/v1'
    
    // Get request body
    const body = await req.json()
    
    // Prepare WhatsApp API payload
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: body.to,
      type: body.type,
    }

    // Add message content based on type
    switch (body.type) {
      case 'text':
        payload.text = body.text
        break
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
      case 'sticker':
        payload[body.type] = body[body.type]
        break
      case 'location':
        payload.location = body.location
        break
      case 'template':
        payload.template = body.template
        break
      default:
        throw new Error(`Unsupported message type: ${body.type}`)
    }

    // Add context if replying
    if (body.context) {
      payload.context = body.context
    }

    // Send message via 360dialog API
    const response = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'D360-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to send message')
    }

    // Add conversation_id to result
    result.conversation_id = `conv_${body.to}`
    result.from = 'business'

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})