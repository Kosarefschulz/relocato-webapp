import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Return default folder structure
    const folders = [
      {
        name: 'INBOX',
        path: 'INBOX',
        delimiter: '/',
        flags: ['\\HasNoChildren'],
        specialUse: '\\Inbox',
        unreadCount: 0,
        totalCount: 0
      },
      {
        name: 'Sent',
        path: 'Sent',
        delimiter: '/',
        flags: ['\\HasNoChildren'],
        specialUse: '\\Sent',
        unreadCount: 0,
        totalCount: 0
      },
      {
        name: 'Drafts',
        path: 'Drafts',
        delimiter: '/',
        flags: ['\\HasNoChildren'],
        specialUse: '\\Drafts',
        unreadCount: 0,
        totalCount: 0
      },
      {
        name: 'Trash',
        path: 'Trash',
        delimiter: '/',
        flags: ['\\HasNoChildren'],
        specialUse: '\\Trash',
        unreadCount: 0,
        totalCount: 0
      },
      {
        name: 'Spam',
        path: 'Spam',
        delimiter: '/',
        flags: ['\\HasNoChildren'],
        specialUse: '\\Junk',
        unreadCount: 0,
        totalCount: 0
      }
    ]

    return new Response(
      JSON.stringify({ 
        success: true,
        folders: folders
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error getting folders:', error)
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