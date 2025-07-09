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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get webhook payload
    const payload = await req.json()
    console.log('Webhook received:', payload)

    // Process messages
    if (payload.messages && payload.messages.length > 0) {
      for (const message of payload.messages) {
        const contact = payload.contacts?.find((c: any) => c.wa_id === message.from)
        
        // Prepare message data
        const messageData: any = {
          wa_message_id: message.id,
          conversation_id: message.conversation_id || `conv_${message.from}`,
          from_number: message.from,
          from_name: contact?.profile?.name,
          to_number: 'business',
          message_type: message.type,
          status: 'received',
          direction: 'inbound',
          timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
          context_message_id: message.context?.id,
          metadata: message
        }

        // Handle different message types
        switch (message.type) {
          case 'text':
            messageData.text_content = message.text.body
            break
          case 'image':
          case 'video':
          case 'audio':
          case 'document':
          case 'sticker':
            const media = message[message.type]
            messageData.media_id = media.id
            messageData.media_mime_type = media.mime_type
            messageData.media_sha256 = media.sha256
            messageData.caption = media.caption
            break
          case 'location':
            messageData.location_latitude = message.location.latitude
            messageData.location_longitude = message.location.longitude
            messageData.location_name = message.location.name
            messageData.location_address = message.location.address
            break
        }

        // Save message to database
        const { error } = await supabase
          .from('whatsapp_messages')
          .insert(messageData)

        if (error) {
          console.error('Error saving message:', error)
        }
      }
    }

    // Process status updates
    if (payload.statuses && payload.statuses.length > 0) {
      for (const status of payload.statuses) {
        const statusMap: any = {
          sent: 'sent',
          delivered: 'delivered',
          read: 'read',
          failed: 'failed'
        }

        const { error } = await supabase
          .from('whatsapp_messages')
          .update({ 
            status: statusMap[status.status] || status.status,
            updated_at: new Date().toISOString()
          })
          .eq('wa_message_id', status.id)

        if (error) {
          console.error('Error updating status:', error)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})