import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import * as ImapClient from 'https://deno.land/x/imap@v0.1.0/mod.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { uid, folder = 'INBOX', starred = true } = await req.json()

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

    console.log(`📧 ${starred ? 'Starring' : 'Unstarring'} email ${uid} in ${folder}`)

    // Connect to IMAP
    const client = new ImapClient.ImapClient(config)
    await client.connect()
    await client.login()

    // Select folder
    await client.select(folder)

    // Add or remove \Flagged flag
    if (starred) {
      await client.store(uid, '+FLAGS', ['\\Flagged'])
    } else {
      await client.store(uid, '-FLAGS', ['\\Flagged'])
    }

    await client.logout()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email ${uid} ${starred ? 'starred' : 'unstarred'}`,
        uid: uid,
        folder: folder,
        starred: starred
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error starring email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})