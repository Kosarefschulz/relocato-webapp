import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import * as ImapClient from 'https://deno.land/x/imap@v0.1.0/mod.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { uid, fromFolder = 'INBOX', toFolder } = await req.json()

    if (!uid || !toFolder) {
      return new Response(
        JSON.stringify({ success: false, error: 'UID and target folder are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // IONOS IMAP configuration
    const config = {
      hostname: Deno.env.get('IONOS_IMAP_HOST') || 'imap.ionos.de',
      port: parseInt(Deno.env.get('IONOS_IMAP_PORT') || '993'),
      username: Deno.env.get('IONOS_EMAIL')!,
      password: Deno.env.get('IONOS_PASSWORD')!,
      secure: true,
      tls: true
    }

    console.log(`📧 Moving email ${uid} from ${fromFolder} to ${toFolder}`)

    // Connect to IMAP
    const client = new ImapClient.ImapClient(config)
    await client.connect()
    await client.login()

    // Select source folder
    await client.select(fromFolder)

    // Move email to target folder
    await client.move(uid, toFolder)

    await client.logout()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email ${uid} moved to ${toFolder}`,
        uid: uid,
        fromFolder: fromFolder,
        toFolder: toFolder
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error moving email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})