import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  try {
    // Get IONOS credentials
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD')
    const IONOS_IMAP_HOST = Deno.env.get('IONOS_IMAP_HOST') || 'imap.ionos.de'
    const IONOS_IMAP_PORT = parseInt(Deno.env.get('IONOS_IMAP_PORT') || '993')

    debugInfo.credentials = {
      email: IONOS_EMAIL,
      host: IONOS_IMAP_HOST,
      port: IONOS_IMAP_PORT,
      hasPassword: !!IONOS_PASSWORD
    }

    // Test 1: DNS Resolution
    try {
      console.log(`🔍 Testing DNS resolution for ${IONOS_IMAP_HOST}...`)
      const startDns = Date.now()
      await Deno.resolveDns(IONOS_IMAP_HOST, "A")
      debugInfo.tests.push({
        test: 'DNS Resolution',
        success: true,
        duration: Date.now() - startDns,
        message: `Successfully resolved ${IONOS_IMAP_HOST}`
      })
    } catch (error) {
      debugInfo.tests.push({
        test: 'DNS Resolution',
        success: false,
        error: error.message
      })
    }

    // Test 2: TCP Connection
    try {
      console.log(`🔌 Testing TCP connection to ${IONOS_IMAP_HOST}:${IONOS_IMAP_PORT}...`)
      const startTcp = Date.now()
      const conn = await Deno.connectTls({
        hostname: IONOS_IMAP_HOST,
        port: IONOS_IMAP_PORT,
      })
      
      // Read greeting
      const buffer = new Uint8Array(1024)
      const n = await conn.read(buffer)
      const greeting = new TextDecoder().decode(buffer.subarray(0, n || 0))
      
      debugInfo.tests.push({
        test: 'TCP/TLS Connection',
        success: true,
        duration: Date.now() - startTcp,
        message: 'Connection established',
        greeting: greeting.trim()
      })

      // Test 3: IMAP Login
      if (IONOS_PASSWORD) {
        try {
          console.log('🔐 Testing IMAP login...')
          const encoder = new TextEncoder()
          const decoder = new TextDecoder()
          
          // Send login command
          const loginCmd = `A001 LOGIN "${IONOS_EMAIL}" "${IONOS_PASSWORD}"\r\n`
          await conn.write(encoder.encode(loginCmd))
          
          // Read response
          const loginBuffer = new Uint8Array(1024)
          const loginN = await conn.read(loginBuffer)
          const loginResponse = decoder.decode(loginBuffer.subarray(0, loginN || 0))
          
          const loginSuccess = loginResponse.includes('A001 OK')
          
          debugInfo.tests.push({
            test: 'IMAP Login',
            success: loginSuccess,
            message: loginSuccess ? 'Login successful' : 'Login failed',
            response: loginResponse.trim()
          })

          if (loginSuccess) {
            // Test 4: List folders
            try {
              console.log('📁 Listing folders...')
              const listCmd = 'A002 LIST "" "*"\r\n'
              await conn.write(encoder.encode(listCmd))
              
              // Read response (may be multiple lines)
              let listResponse = ''
              const listBuffer = new Uint8Array(4096)
              while (true) {
                const n = await conn.read(listBuffer)
                if (n === null) break
                const chunk = decoder.decode(listBuffer.subarray(0, n))
                listResponse += chunk
                if (chunk.includes('A002 OK')) break
              }
              
              // Parse folders
              const folders = listResponse
                .split('\n')
                .filter(line => line.includes('LIST'))
                .map(line => {
                  const match = line.match(/"([^"]+)"$/)
                  return match ? match[1] : null
                })
                .filter(Boolean)
              
              debugInfo.tests.push({
                test: 'List Folders',
                success: true,
                folders: folders,
                message: `Found ${folders.length} folders`
              })

              // Test 5: Check INBOX
              try {
                console.log('📥 Checking INBOX...')
                const selectCmd = 'A003 SELECT INBOX\r\n'
                await conn.write(encoder.encode(selectCmd))
                
                let selectResponse = ''
                const selectBuffer = new Uint8Array(2048)
                while (true) {
                  const n = await conn.read(selectBuffer)
                  if (n === null) break
                  const chunk = decoder.decode(selectBuffer.subarray(0, n))
                  selectResponse += chunk
                  if (chunk.includes('A003 OK')) break
                }
                
                // Extract message count
                const existsMatch = selectResponse.match(/(\d+) EXISTS/)
                const messageCount = existsMatch ? parseInt(existsMatch[1]) : 0
                
                debugInfo.tests.push({
                  test: 'INBOX Status',
                  success: true,
                  messageCount: messageCount,
                  message: `INBOX contains ${messageCount} messages`
                })
              } catch (error) {
                debugInfo.tests.push({
                  test: 'INBOX Status',
                  success: false,
                  error: error.message
                })
              }
            } catch (error) {
              debugInfo.tests.push({
                test: 'List Folders',
                success: false,
                error: error.message
              })
            }
          }

          // Logout
          await conn.write(encoder.encode('A999 LOGOUT\r\n'))
        } catch (error) {
          debugInfo.tests.push({
            test: 'IMAP Login',
            success: false,
            error: error.message
          })
        }
      }

      // Close connection
      conn.close()
    } catch (error) {
      debugInfo.tests.push({
        test: 'TCP/TLS Connection',
        success: false,
        error: error.message,
        details: 'This might be due to firewall restrictions in Supabase Edge Functions'
      })
    }

    // Summary
    const successCount = debugInfo.tests.filter((t: any) => t.success).length
    const totalCount = debugInfo.tests.length
    
    debugInfo.summary = {
      totalTests: totalCount,
      successful: successCount,
      failed: totalCount - successCount,
      overallStatus: successCount === totalCount ? 'All tests passed' : 'Some tests failed'
    }

    return new Response(
      JSON.stringify(debugInfo),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Debug error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debugInfo: debugInfo
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})