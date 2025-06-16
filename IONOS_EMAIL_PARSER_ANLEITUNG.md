# 📧 IONOS E-Mail Parser - Komplette Anleitung

## 🎯 Was macht diese Lösung?

Ersetzt Ihren teuren Zapier-Workflow (€50-200/Monat) durch eine **kostenlose** Firebase-Lösung:

- ✅ Prüft automatisch alle 5 Minuten Ihr IONOS Postfach
- ✅ Erkennt E-Mails von ImmoScout24 und Umzug365
- ✅ Erstellt automatisch Kunden in Ihrer Datenbank
- ✅ Generiert Angebote mit intelligenter Preisberechnung
- ✅ Sendet Willkommens-E-Mails an Kunden
- ✅ **Kosten: €0/Monat** (statt €50-200 mit Zapier)

## 🚀 Super-Einfache Einrichtung (15 Minuten)

### Schritt 1: Automatisches Setup-Skript ausführen

```bash
# Im Hauptverzeichnis Ihrer App:
./setup-email-parser.sh
```

Das Skript führt Sie durch alle Schritte:
1. Fragt nach Ihrer IONOS E-Mail (Standard: anfragen@relocato.de)
2. Fragt nach Ihrem IONOS App-Passwort
3. Deployed automatisch alles zu Firebase

### Schritt 2: IONOS App-Passwort erstellen

1. Gehen Sie zu: **IONOS Kundencenter**
2. **E-Mail & Office** → **E-Mail-Postfächer**
3. Wählen Sie Ihr Postfach (anfragen@relocato.de)
4. **Einstellungen** → **App-Passwörter**
5. **Neues App-Passwort** erstellen
6. Namen eingeben: "Firebase Email Parser"
7. Passwort kopieren (wird nur einmal angezeigt!)

### Schritt 3: Testen

Senden Sie eine Test-E-Mail an **anfragen@relocato.de**:

```
Betreff: Umzugsanfrage von ImmoScout24

Kontaktname: Max Mustermann
Telefon: 0171 1234567
E-Mail: max@example.com
Umzugsdatum: 15.03.2024
Von: Berliner Str. 123, 10115 Berlin
Nach: Hamburger Str. 456, 20095 Hamburg
Zimmeranzahl: 3
Wohnfläche: 85 m²
```

Nach max. 5 Minuten sollte der Kunde in Ihrer Firebase Console erscheinen!

## 📊 So prüfen Sie, ob es funktioniert

### 1. Live-Logs ansehen:
```bash
firebase functions:log --only checkAndParseEmails
```

### 2. In der Firebase Console:
- **Firestore** → Collection **"customers"** → Neuer Kunde sollte erscheinen
- **Functions** → **checkAndParseEmails** → Logs

### 3. Fehler-Debugging:
- Fehlgeschlagene E-Mails werden in Collection **"failedEmails"** gespeichert
- System-Fehler in Collection **"systemErrors"**

## 🔧 Häufige Probleme & Lösungen

### "IONOS Zugangsdaten fehlen!"
```bash
# Zugangsdaten neu setzen:
firebase functions:config:set ionos.email="anfragen@relocato.de" ionos.password="IHR_APP_PASSWORT"
firebase deploy --only functions
```

### E-Mails werden nicht erkannt
1. Prüfen Sie in **failedEmails** Collection
2. E-Mail-Format muss dem Beispiel entsprechen
3. Absender muss "immoscout24" oder "umzug365" enthalten

### "IMAP Verbindung fehlgeschlagen"
- Prüfen Sie das App-Passwort (nicht normales Passwort!)
- Stellen Sie sicher, dass IMAP aktiviert ist (Standard bei IONOS)

## 💡 Erweiterte Funktionen

### Manuelle E-Mail-Prüfung auslösen:
```javascript
// In Ihrer App oder Firebase Console:
firebase.functions().httpsCallable('manualEmailCheck')()
  .then(result => console.log(result.data));
```

### E-Mail-Parser anpassen:
Bearbeiten Sie `functions/emailParser.js` um neue Quellen hinzuzufügen:

```javascript
// Beispiel: eBay Kleinanzeigen hinzufügen
ebay_kleinanzeigen: {
  patterns: {
    name: [/Interessent:\s*(.+?)(?:\n|$)/i],
    phone: [/Telefon:\s*(.+?)(?:\n|$)/i],
    // ... weitere Patterns
  }
}
```

### Preisberechnung anpassen:
In `functions/index.js` → `createAutomaticQuote()`:

```javascript
const basePrice = 450;      // Grundpreis
const pricePerRoom = 150;   // Pro Zimmer
const pricePerSqm = 8;      // Pro m²
const pricePerFloor = 50;   // Pro Etage ohne Aufzug
```

## 📈 Ihre Ersparnis

| Lösung | Monatliche Kosten | Setup-Zeit |
|--------|------------------|------------|
| Zapier | €50-200 | 2-4 Stunden |
| **Firebase (diese Lösung)** | **€0** ✨ | **15 Minuten** |

**Jährliche Ersparnis: €600-2.400!** 🎉

## 🆘 Support

### Logs in Echtzeit:
```bash
firebase functions:log --follow
```

### Statistiken ansehen:
- Firebase Console → Firestore → **dailyReports** Collection

### Bei Problemen:
1. Prüfen Sie die Logs
2. Schauen Sie in die **failedEmails** Collection
3. Führen Sie das Setup-Skript erneut aus

## 🎯 Das war's!

Ihre E-Mail-Automatisierung läuft jetzt:
- ✅ Keine monatlichen Kosten
- ✅ Vollautomatisch
- ✅ Zuverlässig
- ✅ Erweiterbar

**Tipp**: Speichern Sie diese Anleitung für später!