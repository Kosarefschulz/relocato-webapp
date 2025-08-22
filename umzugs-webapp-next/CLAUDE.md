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

## ANGEBOTSDATEN-INTEGRATION ZIEL:
Das Hauptziel ist es, echte Angebotsdaten aus Lexware zu extrahieren:
- Angebots-Positionen (LineItems) mit Bezeichnung, Menge, Einzelpreis
- MwSt-Berechnungen und Gesamtsummen
- Angebotsstatus (offen, angenommen, abgelehnt)
- Angebotsnummern und Gültigkeitsdaten
- Kundendaten aus Angeboten (nicht nur Kontakte)

BEISPIEL AG0066 Goldbeck West GmbH:
- 8 Positionen für Feuchtigkeitsschaden-Sanierung
- Zwischensumme: €3.035,00 / MwSt: €576,65 / Gesamt: €3.611,65
- Echte Beschreibungen wie "Büro 5.14 - Rückbau Deckenplatten"

## LEXWARE API ANALYSE ERGEBNIS:
Nach systematischer Prüfung aller 30 möglichen Endpoints sind verfügbar:
✅ /ping - API Health Check
✅ /contacts - Alle Kontakte (189 total)
✅ /contacts?role=customer - Nur Kunden

❌ NICHT VERFÜGBAR:
- /quotations - Angebote-API (400/404 Fehler)
- /invoices - Rechnungs-API (400/404 Fehler)  
- /documents - Dokument-API (404 Fehler)
- /orders, /projects, /items, /services (alle nicht zugänglich)

FAZIT: Nur Kontakt-Daten verfügbar, KEINE Angebots-/Rechnungsdaten.
Lösung: PDF-basierte Datenextraktion oder CSV-Import verwenden.

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