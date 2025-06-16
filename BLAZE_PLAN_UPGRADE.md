# ⚡ Firebase Blaze Plan Upgrade (Pflicht für E-Mail Parser)

## Warum ist das nötig?

Firebase Functions (für den E-Mail Parser) benötigen den **Blaze Plan**. Das ist der "Pay-as-you-go" Plan.

**Keine Sorge**: Bei Ihrer Nutzung (200-300 E-Mails/Monat) bleiben die Kosten bei **€0-5/Monat**!

## 🚀 So upgraden Sie (2 Minuten):

### 1. Firebase Console öffnen:
https://console.firebase.google.com/project/umzugsapp/usage/details

### 2. "Upgrade" Button klicken
- Wählen Sie "Blaze" Plan
- Geben Sie Ihre Zahlungsinformationen ein

### 3. Budget-Alarm setzen (optional aber empfohlen):
- Setzen Sie ein Budget von €10/Monat
- Sie bekommen eine E-Mail wenn 50% erreicht sind

## 💰 Kostenübersicht:

| Service | Kostenlos enthalten | Ihre Nutzung | Kosten |
|---------|-------------------|--------------|--------|
| Functions Aufrufe | 2 Mio/Monat | ~8.640/Monat | €0 |
| Compute Zeit | 400.000 GB-sec | ~1.000 GB-sec | €0 |
| Firestore Reads | 50.000/Tag | ~300/Tag | €0 |
| Firestore Writes | 20.000/Tag | ~300/Tag | €0 |

**Geschätzte Gesamtkosten: €0-5/Monat** ✅

## Nach dem Upgrade:

Führen Sie diesen Befehl aus:
```bash
firebase deploy --only functions
```

Der E-Mail Parser läuft dann automatisch!

## 🆘 Hilfe

Falls Sie unsicher sind:
- Der Blaze Plan hat KEINE Grundgebühr
- Sie zahlen nur was Sie nutzen
- Mit Budget-Alarm haben Sie volle Kontrolle
- Sie können jederzeit kündigen

## Alternative (nicht empfohlen):

Falls Sie kein Upgrade möchten, müssen Sie bei Zapier bleiben (€50-200/Monat).