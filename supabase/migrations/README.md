# Supabase Migrationen

## Migration ausführen

### Via Supabase Dashboard (SQL Editor)

1. Öffne https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/sql
2. Kopiere den Inhalt von `20251001_add_customer_phase.sql`
3. Füge ihn in den SQL Editor ein
4. Klicke auf "Run"

### Was macht die Migration?

Die Migration `20251001_add_customer_phase.sql` fügt ein Kundenphasen-System hinzu:

#### Neue Spalten in `customers`:
- `current_phase` - Aktuelle Phase des Kunden (Enum)
- `phase_updated_at` - Zeitpunkt der letzten Phasenänderung
- `phase_history` - JSON-Array mit Historie aller Phasenänderungen

#### Phasen (Enum-Werte):
1. `angerufen` - Erstkontakt hergestellt
2. `angebot_erstellt` - Angebot wurde erstellt
3. `besichtigung_geplant` - Besichtigungstermin vereinbart
4. `durchfuehrung` - Umzug wird durchgeführt
5. `rechnung` - Rechnung erstellt/versendet
6. `bewertung` - Warte auf Kundenbewertung
7. `archiviert` - Prozess abgeschlossen

#### Automatische Features:
- Trigger aktualisiert `phase_updated_at` bei Phasenänderung
- Trigger speichert Historie in `phase_history` JSONB
- Index für Performance bei Phasenabfragen

## Nach der Migration

Die App zeigt automatisch:
- **CustomerDetails**: Horizontale Phase-Selector Pills oben
- **CustomersList**: Phase-Badge neben Kundenname
- Farbcodierung pro Phase
- Klickbar zum Ändern der Phase (speichert in Supabase)
