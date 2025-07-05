import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, mimeType } = await req.json()

    if (!image) {
      throw new Error('No image provided')
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('🤖 Analyzing room image with GPT-4 Vision...')

    // Prepare the prompt for GPT-4 Vision
    const prompt = `Du bist ein Experte für Umzüge und sollst dieses Foto eines Raumes analysieren.

Bitte identifiziere:
1. Um welchen Raum es sich handelt (Wohnzimmer, Schlafzimmer, Küche, etc.)
2. Alle sichtbaren Möbel und Gegenstände mit geschätzter Anzahl
3. Kategorisiere die Gegenstände (Möbel, Elektronik, Kartons, Zerbrechlich, etc.)
4. Schätze das Volumen in Kubikmetern für jeden größeren Gegenstand
5. Identifiziere besondere Herausforderungen (schwere Möbel, zerbrechliche Gegenstände, etc.)

Antworte im folgenden JSON-Format:
{
  "room": "Name des Raumes",
  "items": [
    {
      "name": "Gegenstand",
      "quantity": 1,
      "category": "Kategorie",
      "fragile": true/false,
      "heavy": true/false,
      "estimatedVolume": 0.0
    }
  ],
  "specialNotes": ["Besondere Hinweise"]
}`

    // Call OpenAI GPT-4 Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from GPT-4 Vision')
    }

    console.log('✅ GPT-4 Vision analysis complete')

    // Try to parse the JSON response
    let analysis
    try {
      // Extract JSON from the response (sometimes GPT-4 adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse GPT-4 response:', content)
      // Fallback to basic structure
      analysis = {
        room: 'Unbekannter Raum',
        items: [],
        specialNotes: ['Automatische Analyse fehlgeschlagen - bitte manuell prüfen']
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysis,
        rawResponse: content
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error analyzing image:', error)
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