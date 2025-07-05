import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import * as ImapClient from 'https://deno.land/x/imap@v0.1.0/mod.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, folder = 'INBOX' } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
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

    console.log(`📧 Searching for "${query}" in ${folder}`)

    // Connect to IMAP
    const client = new ImapClient.ImapClient(config)
    await client.connect()
    await client.login()

    // Select folder
    await client.select(folder)

    // Build search criteria
    const searchCriteria = [
      'OR',
      ['SUBJECT', query],
      'OR',
      ['FROM', query],
      ['BODY', query]
    ]

    // Search emails
    const searchResults = await client.search(searchCriteria)
    
    // Fetch email details for search results
    const emails = []
    if (searchResults && searchResults.length > 0) {
      const fetchData = await client.fetch(searchResults.join(','), {
        envelope: true,
        flags: true,
        bodystructure: true
      })

      for (const msg of fetchData) {
        emails.push({
          uid: msg.uid,
          from: msg.envelope.from ? {
            name: msg.envelope.from[0].name || '',
            address: msg.envelope.from[0].mailbox + '@' + msg.envelope.from[0].host
          } : { address: 'unknown@unknown.com' },
          to: msg.envelope.to ? msg.envelope.to.map(addr => ({
            address: addr.mailbox + '@' + addr.host
          })) : [],
          subject: msg.envelope.subject || '(No subject)',
          date: msg.envelope.date,
          flags: msg.flags || [],
          folder: folder,
          preview: msg.envelope.subject || ''
        })
      }
    }

    await client.logout()

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails: emails,
        total: emails.length,
        query: query,
        folder: folder
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error searching emails:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})