import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import * as ImapClient from 'https://deno.land/x/imap@v0.1.0/mod.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { uid, folder = 'INBOX' } = await req.json()

    if (!uid) {
      return new Response(
        JSON.stringify({ success: false, error: 'UID is required' }),
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

    console.log(`📧 Deleting email ${uid} from ${folder}`)

    // Connect to IMAP
    const client = new ImapClient.ImapClient(config)
    await client.connect()
    await client.login()

    // Select folder
    await client.select(folder)

    // Move to Trash (or delete permanently if already in Trash)
    if (folder.toLowerCase() === 'trash' || folder.toLowerCase() === 'papierkorb') {
      // Permanent delete
      await client.store(uid, '+FLAGS', ['\\Deleted'])
      await client.expunge()
    } else {
      // Move to Trash
      await client.move(uid, 'Trash')
    }

    await client.logout()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email ${uid} deleted successfully`,
        uid: uid,
        folder: folder
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error deleting email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})