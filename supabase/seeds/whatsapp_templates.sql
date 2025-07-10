-- Beispiel WhatsApp Templates für Umzugsunternehmen
-- HINWEIS: Diese müssen bei 360dialog/Meta zur Genehmigung eingereicht werden!

-- Angebots-Template
INSERT INTO public.whatsapp_templates (
    template_name,
    template_id,
    language,
    category,
    status,
    header_type,
    header_content,
    body_content,
    footer_content,
    buttons
) VALUES (
    'umzug_angebot_versandt',
    'umzug_angebot_versandt_de',
    'de',
    'UTILITY',
    'pending',
    'text',
    'Ihr Umzugsangebot ist fertig!',
    'Hallo {{1}},

vielen Dank für Ihre Anfrage! Ihr persönliches Umzugsangebot für den {{2}} ist fertig.

📄 Angebotsnummer: {{3}}
💰 Gesamtpreis: {{4}} €

Das detaillierte Angebot haben wir Ihnen per E-Mail zugesandt.

Bei Fragen stehen wir Ihnen gerne zur Verfügung!',
    'Relocato Umzüge - Ihr Partner für stressfreie Umzüge',
    '[{"type": "QUICK_REPLY", "text": "Angebot annehmen"}, {"type": "QUICK_REPLY", "text": "Rückfragen"}]'::jsonb
);

-- Termin-Erinnerung
INSERT INTO public.whatsapp_templates (
    template_name,
    template_id,
    language,
    category,
    status,
    header_type,
    header_content,
    body_content,
    footer_content
) VALUES (
    'umzug_termin_erinnerung',
    'umzug_termin_erinnerung_de',
    'de',
    'UTILITY',
    'pending',
    'text',
    'Erinnerung: Ihr Umzugstermin',
    'Hallo {{1}},

wir möchten Sie an Ihren bevorstehenden Umzugstermin erinnern:

📅 Datum: {{2}}
🕐 Uhrzeit: {{3}}
📍 Abholadresse: {{4}}
📍 Zieladresse: {{5}}

Unser Team wird pünktlich bei Ihnen sein. Bitte stellen Sie sicher, dass:
✅ Alle Kartons gepackt und beschriftet sind
✅ Der Zugang zu beiden Adressen gewährleistet ist
✅ Parkplätze reserviert sind (falls besprochen)

Bei Fragen erreichen Sie uns unter dieser Nummer.',
    'Ihr Relocato Team'
);

-- Willkommens-Nachricht nach Erstanfrage
INSERT INTO public.whatsapp_templates (
    template_name,
    template_id,
    language,
    category,
    status,
    header_type,
    body_content,
    footer_content,
    buttons
) VALUES (
    'umzug_willkommen',
    'umzug_willkommen_de',
    'de',
    'MARKETING',
    'pending',
    null,
    'Hallo {{1}},

vielen Dank für Ihre Umzugsanfrage bei Relocato! 

Wir haben Ihre Anfrage erhalten und werden Ihnen innerhalb von 24 Stunden ein unverbindliches Angebot zusenden.

Um Ihnen das beste Angebot erstellen zu können, benötigen wir noch folgende Informationen:
- Genaue Anzahl der Zimmer
- Etage (mit/ohne Aufzug)
- Besondere Gegenstände (Klavier, Safe, etc.)

Sie können uns diese Infos einfach hier per WhatsApp mitteilen!',
    'Relocato - Umzüge mit Herz',
    '[{"type": "QUICK_REPLY", "text": "Infos nachreichen"}]'::jsonb
);

-- Umzug abgeschlossen
INSERT INTO public.whatsapp_templates (
    template_name,
    template_id,
    language,
    category,
    status,
    header_type,
    header_content,
    body_content,
    footer_content,
    buttons
) VALUES (
    'umzug_abgeschlossen',
    'umzug_abgeschlossen_de',
    'de',
    'UTILITY',
    'pending',
    'text',
    'Umzug erfolgreich abgeschlossen ✅',
    'Hallo {{1}},

wir hoffen, Sie sind gut in Ihrem neuen Zuhause angekommen!

Vielen Dank, dass Sie sich für Relocato entschieden haben. Ihre Rechnung mit der Nummer {{2}} haben wir Ihnen per E-Mail zugesandt.

Wir würden uns sehr über Ihre Bewertung freuen! Teilen Sie Ihre Erfahrung mit anderen Kunden.',
    'Alles Gute in Ihrem neuen Zuhause wünscht Ihr Relocato Team',
    '[{"type": "URL", "text": "Bewertung abgeben", "url": "https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review"}]'::jsonb
);

-- Zahlungserinnerung
INSERT INTO public.whatsapp_templates (
    template_name,
    template_id,
    language,
    category,
    status,
    header_type,
    header_content,
    body_content,
    footer_content
) VALUES (
    'umzug_zahlungserinnerung',
    'umzug_zahlungserinnerung_de',
    'de',
    'UTILITY',
    'pending',
    'text',
    'Zahlungserinnerung',
    'Hallo {{1}},

wir möchten Sie freundlich an die noch offene Rechnung erinnern:

📄 Rechnungsnummer: {{2}}
💰 Betrag: {{3}} €
📅 Fällig seit: {{4}}

Bitte überweisen Sie den Betrag auf unser Konto:
IBAN: DE12 3456 7890 1234 5678 90
Verwendungszweck: {{2}}

Falls Sie bereits gezahlt haben, betrachten Sie diese Nachricht als gegenstandslos.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
    'Relocato Umzüge'
);

-- Status Update während des Umzugs
INSERT INTO public.whatsapp_templates (
    template_name,
    template_id,
    language,
    category,
    status,
    header_type,
    body_content,
    footer_content
) VALUES (
    'umzug_status_update',
    'umzug_status_update_de',
    'de',
    'UTILITY',
    'pending',
    null,
    'Hallo {{1}},

Update zu Ihrem Umzug:

{{2}}

Voraussichtliche Ankunft am Zielort: {{3}}

Ihr Relocato Team ist für Sie im Einsatz! 🚛',
    'Bei Fragen erreichen Sie uns unter dieser Nummer.'
);

-- Hinweis: Parameters in den Templates:
-- {{1}} = Kundenname
-- {{2}} = Datum/Spezifische Info
-- {{3}} = Weitere Details
-- {{4}} = Beträge/Adressen
-- {{5}} = Zusätzliche Infos

-- Die genaue Zuordnung muss beim Versenden im Code erfolgen