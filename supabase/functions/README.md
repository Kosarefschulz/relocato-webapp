# Supabase Edge Functions für E-Mail

Diese Edge Functions müssen in Ihrem Supabase-Projekt erstellt werden, um die E-Mail-Funktionalität zu gewährleisten.

## Benötigte Edge Functions

### 1. send-email
Sendet E-Mails über IONOS SMTP.

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

serve(async (req) => {
  const { to, subject, content, html, attachments } = await req.json()
  
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.ionos.de',
      port: 587,
      tls: true,
      auth: {
        username: Deno.env.get('IONOS_EMAIL'),
        password: Deno.env.get('IONOS_PASSWORD'),
      },
    },
  })

  try {
    await client.send({
      from: Deno.env.get('IONOS_EMAIL'),
      to,
      subject,
      content: content || '',
      html: html || content,
      attachments,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    await client.close()
  }
})
```

### 2. email-list
Listet E-Mails aus einem IMAP-Ordner.

```typescript
// supabase/functions/email-list/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ImapClient } from 'https://deno.land/x/imap@v0.1.0/mod.ts'

serve(async (req) => {
  const { folder = 'INBOX', page = 1, limit = 50 } = await req.json()
  
  const client = new ImapClient({
    hostname: 'imap.ionos.de',
    port: 993,
    tls: true,
    auth: {
      username: Deno.env.get('IONOS_EMAIL'),
      password: Deno.env.get('IONOS_PASSWORD'),
    },
  })

  try {
    await client.connect()
    await client.select(folder)
    
    const messages = await client.search(['ALL'])
    const start = (page - 1) * limit
    const end = start + limit
    const messageIds = messages.slice(start, end)
    
    const emails = []
    for (const id of messageIds) {
      const msg = await client.fetch(id, { 
        envelope: true, 
        bodystructure: true,
        body: true 
      })
      emails.push({
        uid: id,
        subject: msg.envelope.subject,
        from: msg.envelope.from[0],
        to: msg.envelope.to,
        date: msg.envelope.date,
        flags: msg.flags,
        body: msg.body?.text,
        html: msg.body?.html,
      })
    }

    return new Response(JSON.stringify({ 
      emails, 
      total: messages.length 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      emails: [], 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    await client.logout()
  }
})
```

### 3. email-folders
Zeigt verfügbare E-Mail-Ordner.

```typescript
// supabase/functions/email-folders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ImapClient } from 'https://deno.land/x/imap@v0.1.0/mod.ts'

serve(async (req) => {
  const client = new ImapClient({
    hostname: 'imap.ionos.de',
    port: 993,
    tls: true,
    auth: {
      username: Deno.env.get('IONOS_EMAIL'),
      password: Deno.env.get('IONOS_PASSWORD'),
    },
  })

  try {
    await client.connect()
    const folders = await client.list()
    
    return new Response(JSON.stringify({ 
      folders: folders.map(f => ({
        name: f.name,
        path: f.path,
        delimiter: f.delimiter,
        flags: f.flags,
        specialUse: f.specialUse,
      }))
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      folders: [], 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    await client.logout()
  }
})
```

## Umgebungsvariablen

Fügen Sie diese Umgebungsvariablen in Ihrem Supabase-Projekt hinzu:

```bash
IONOS_EMAIL=bielefeld@relocato.de
IONOS_PASSWORD=<Ihr IONOS Passwort>
```

## Deployment

```bash
# Einzelne Function deployen
supabase functions deploy send-email
supabase functions deploy email-list
supabase functions deploy email-folders

# Alle Functions deployen
supabase functions deploy
```

## Lokale Entwicklung

```bash
# Einzelne Function lokal ausführen
supabase functions serve send-email --env-file ./supabase/.env.local

# Alle Functions lokal ausführen
supabase functions serve --env-file ./supabase/.env.local
```