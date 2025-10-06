# 📞 Telefon-Gesprächsleitfäden - Relocato

## 🎯 Eingehender Anruf - Standard-Ablauf

### 1. Begrüßung
```
"RELOCATO® Umzüge, [IHR_NAME], guten Tag!"
```

### 2. Anliegen erfragen
```
"Wie kann ich Ihnen helfen?"
```

---

## 💬 Scenario 1: Umzugsanfrage

### Schritt 1: Grunddaten erfassen
```
"Gerne erstelle ich Ihnen ein Angebot. Dafür brauche ich ein paar Informationen:

1. Ihr Name?
2. Von wo ziehen Sie um? (Adresse, Ort)
3. Wohin geht der Umzug? (Adresse, Ort)
4. Wann soll der Umzug stattfinden?
5. Wie groß ist Ihre Wohnung ungefähr? (Zimmeranzahl oder m²)
```

### Schritt 2: Details erfragen
```
"Perfekt! Noch ein paar Details:

- In welcher Etage wohnen Sie aktuell? Gibt es einen Aufzug?
- In welche Etage geht es? Auch Aufzug?
- Haben Sie besondere Gegenstände? (Klavier, Aquarium, etc.)
- Brauchen Sie Zusatzleistungen? (Einpacken, Möbelmontage, Reinigung)
```

### Schritt 3: Volumen schätzen
```
INTERN (nicht laut):
- Zimmeranzahl → Volumen schätzen
- 1 Zimmer = ca. 10m³
- 2 Zimmer = ca. 15m³
- 3 Zimmer = ca. 25m³
- 4 Zimmer = ca. 35m³

"Bei einer [X]-Zimmer-Wohnung rechnen wir mit ca. [Y]m³."
```

### Schritt 4: Preis-Indikation (grob)
```
"Einen Moment, ich kalkuliere kurz..."

[KI: calculate_quote_price Tool nutzen]

"Für Ihren Umzug würden wir bei ca. [PREIS]€ liegen.
Das ist eine erste Schätzung - das genaue Angebot
bekommen Sie per E-Mail."
```

### Schritt 5: Nächste Schritte
```
"Ich sende Ihnen das detaillierte Angebot heute noch per E-Mail zu.

Möchten Sie vorab eine Besichtigung? Das ist kostenlos und
gibt uns beiden mehr Sicherheit beim Preis."

WENN JA:
"Wann würde es Ihnen passen? [Termine vorschlagen]"

WENN NEIN:
"Kein Problem! Sie erhalten das Angebot per E-Mail.
Bei Fragen können Sie sich jederzeit melden."
```

### Schritt 6: Kontaktdaten bestätigen
```
"Ihre E-Mail-Adresse für das Angebot?"
"Telefonnummer für Rückfragen?"

"Perfekt! Sie hören spätestens heute Abend von uns.
Haben Sie noch Fragen?"
```

### Schritt 7: Verabschiedung
```
"Vielen Dank für Ihren Anruf, [NAME]!
Auf Wiederhören!"
```

---

## 📞 Scenario 2: Terminänderung

### Kunde will Termin verschieben
```
"Kein Problem, Herr/Frau [NAME]. Aus welchem Grund müssen
wir verschieben?"

[Notiz machen]

"Wann würde es Ihnen besser passen?"

[Kalender prüfen]

WENN VERFÜGBAR:
"[NEUER_TERMIN] ist frei. Ich buche das für Sie um.
Sie erhalten eine Bestätigung per E-Mail."

WENN NICHT VERFÜGBAR:
"[DATUM] ist leider schon belegt. Ich hätte:
- Option 1: [DATUM1]
- Option 2: [DATUM2]
- Option 3: [DATUM3]

Was würde Ihnen passen?"
```

### Wichtig:
- **>48h vorher:** Kostenfrei
- **24-48h vorher:** "Das ist kurzfristig - 50% des Preises fallen an"
- **<24h vorher:** "So kurzfristig müssen wir leider 100% berechnen"

---

## 📞 Scenario 3: Reklamation

### Kunde beschwert sich
```
"Das tut mir sehr leid zu hören, [NAME].
Erzählen Sie mir bitte genau was passiert ist."

[AKTIV ZUHÖREN - NOTIZEN MACHEN]

"Ich verstehe. Das ist natürlich ärgerlich.
Lassen Sie mich das sofort klären."

[Schadensdokumentation erstellen]

Optionen:
1. "Ich leite das an unsere Schadensabteilung weiter.
   Sie melden sich innerhalb 24h bei Ihnen."

2. "Wir kommen vorbei und schauen uns das an.
   Wann passt es Ihnen?"

3. "Wir erstatten Ihnen [X]€ als Entschädigung."

WICHTIG: Immer ernst nehmen, nie ab wehren!
"Wir finden eine Lösung, versprochen!"
```

---

## 📞 Scenario 4: Preisverhandlung

### Kunde findet es zu teuer
```
"Ich verstehe. Lassen Sie uns schauen wo wir
optimieren können.

Optionen:
1. Verzicht auf Zusatzleistungen
   'Brauchen Sie wirklich den Einpackservice?
   Das spart [X]€'

2. Selbstbeteiligung
   'Sie könnten Kartons selbst packen - spart Geld'

3. Flexible Termine
   'Unter der Woche ist oft günstiger als Wochenende'

4. Teilleistung
   'Wir können nur Transport machen, Sie helfen beim Tragen'

Was wäre für Sie am interessantesten?"
```

### Bei Vergleichsangebot
```
"Haben Sie ein anderes Angebot? Darf ich fragen von wem
und zu welchem Preis?"

[Vergleichen]

"Schauen Sie bitte genau was inkludiert ist:
- Ist Versicherung dabei?
- Wie viele Helfer?
- Wie lange dauert es?
- Gibt es Zusatzkosten?

Wir sind oft nur scheinbar teurer - bieten aber mehr Leistung!"
```

---

## 📞 Scenario 5: Kurzfristige Anfrage

### Kunde braucht SOFORT
```
"Wie kurzfristig genau? Ab wann brauchen Sie uns?"

WENN <3 TAGE:
"Das ist sehr kurzfristig. Lassen Sie mich prüfen..."

[Kalender checken]

WENN MÖGLICH:
"Wir können es einrichten! Bei so kurzfristigen Aufträgen
berechnen wir allerdings einen Express-Zuschlag von 15-20%.
Ist das okay für Sie?"

WENN NICHT MÖGLICH:
"Leider sind wir so kurzfristig ausgebucht.
Wir hätten ab [NÄCHSTER_TERMIN] Zeit. Hilft Ihnen das?"
```

---

## 📞 Scenario 6: Terminbestätigung (ausgehend)

### 2 Tage vor Umzug anrufen
```
"Guten Tag [NAME], hier [IHR_NAME] von RELOCATO.

Ich rufe kurz an zur Bestätigung Ihres Umzugs
übermorgen, [DATUM] um [UHRZEIT].

Ist alles bereit? Haben Sie noch Fragen?"

Checkliste durchgehen:
✓ "Sind die Kartons gepackt?"
✓ "Ist der Parkplatz freigehalten?"
✓ "Haben Sie Wertsachen separat?"
✓ "Zählerstände notiert?"

"Perfekt! Dann sehen wir uns [TAG] um [UHRZEIT].
Bei Fragen: Jederzeit anrufen!"
```

---

## 🎯 Verkaufs-Psychologie

### Positive Formulierungen:
❌ "Das wird teuer"
✅ "Das ist eine Investition in einen stressfreien Umzug"

❌ "Das geht nicht"
✅ "Dafür habe ich eine Alternative..."

❌ "Weiß ich nicht"
✅ "Gute Frage! Ich kläre das für Sie und rufe zurück."

### Vertrauen aufbauen:
✅ Namen merken und nutzen
✅ Aktiv zuhören
✅ Konkrete Daten/Zahlen nennen
✅ Erfahrung betonen ("Wir machen das seit X Jahren")
✅ Referenzen erwähnen ("Wir haben letzte Woche...")

### Urgency erzeugen:
```
"Für [WUNSCH_DATUM] habe ich aktuell noch [X] Slots frei.
Die sind oft schnell weg - soll ich einen für Sie reservieren?"
```

---

## ⚠️ Schwierige Situationen

### Aggressiver Kunde
```
REGEL: Ruhig bleiben, nicht persönlich nehmen

"Ich verstehe dass Sie verärgert sind.
Lassen Sie uns gemeinsam eine Lösung finden."

[Nicht unterbrechen lassen, aber bestimmt bleiben]

Bei Eskalation:
"Ich verbinde Sie mit meinem Vorgesetzten, einen Moment bitte."
```

### Endlos-Frager
```
"Das sind alles wichtige Fragen! Ich schlage vor:
Ich sende Ihnen unser Angebot mit allen Details,
dann können Sie in Ruhe schauen und wir telefonieren
nochmal wenn Sie weitere Fragen haben. Passt das?"
```

### Unentschlossener
```
"Ich verstehe, das ist eine wichtige Entscheidung.
Was genau hält Sie noch ab?"

[Einwände herausfinden und entkräften]

"Möchten Sie sich noch andere Angebote ansehen?
Das ist völlig okay! Unser Angebot bleibt [X] Tage gültig."
```

---

## 📝 Nach-Gespräch-Routine

### Sofort im CRM dokumentieren:
1. **Kunde anlegen** (falls neu)
2. **Phase setzen** ("angerufen")
3. **Notizen** (alles Wichtige)
4. **Angebot erstellen** (falls gewünscht)
5. **Follow-Up anlegen** (7 Tage)

### Angebot versenden:
- **Sofort per E-Mail**
- **Mit persönlicher Note**
- **Follow-Up-Datum setzen**

---

## 💡 Profi-Tipps

### Aktives Zuhören:
- Kunde ausreden lassen
- Zusammenfassen: "Verstehe ich richtig, Sie..."
- Nachfragen bei Unklarheiten

### Zeitmanagement:
- **Durchschnitt: 10-15min** pro Anruf-Anfrage
- Bei >20min: "Darf ich Sie zurückrufen mit allen Details?"

### Notizen:
- IMMER mitschreiben
- Besonderheiten markieren
- Ins CRM übertragen

---

**Goldene Regel:** Freundlich, professionell, lösungsorientiert!