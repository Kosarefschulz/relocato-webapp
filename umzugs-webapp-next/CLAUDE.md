# Projekt: Next.js 15.5 Umzugs-CRM

## Technologie-Stack
- Frontend: Next.js 15.5 mit Turbopack
- Backend: Next.js API Routes
- Datenbank: Supabase (PostgreSQL)
- E-Mail: IONOS SMTP über Supabase Edge Functions
- Hosting: Vercel
- UI: MUI 7 + Organic Color Palette

## Lexware Integration
- API Key: xb.8idh-bvrFFndaNb9mccSekihwrWvRdwR.9RDiA-nidwPg
- Endpoint: https://api.lexware.io/v1
- Kundendaten aus Angeboten (/api/lexware/quotes-customers)
- Automatische Synchronisation alle 5 Minuten
- Echte Angebots-Preise und Status-Tracking

## Wichtige Hinweise
- Nur echte Lexware-Angebots-Kunden verwenden
- Keine Mock-Daten oder Demo-Daten erstellen
- Kunden aus /quotations API (nicht /contacts)
- Chronologische Sortierung nach Angebots-Zeitstempel

# KRITISCHE REGEL - KEINE MOCK-DATEN
NIEMALS Mock-Daten, Demo-Daten oder Test-Daten erstellen oder verwenden!
IMMER nur echte Daten aus Lexware-API oder echten Quellen verwenden.
KEINE getDemoCustomers(), getMockData() oder ähnliche Funktionen erstellen.
Nur echte Lexware-Angebots-Kunden aus /api/lexware/quotes-customers verwenden.

## Farbschema (Organic Natural)
- Beige: #e6eed6 (Warmer Hintergrund)
- Beige-2: #dde2c6 (Papier-Oberflächen)  
- Ash Gray: #bbc5aa (Natürliches Grau-Grün)
- Rufous: #a72608 (Elegantes Rostrot)
- Smoky Black: #090c02 (Tiefer Kontrast)

## Features
- Video-Hintergrund für cinematische Erfahrung
- Glassmorphism UI mit Backdrop-Blur
- Slow-Motion Animationen (1.2s + 0.2s stagger)
- Real-time Lexware-Synchronisation
- Intelligente Kundensuche mit Preisanzeige