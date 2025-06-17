# E-Mail Client Benutzerhandbuch

## Übersicht
Der integrierte E-Mail Client ist jetzt vollständig mit Ihrem IONOS E-Mail-Konto (bielefeld@relocato.de) verbunden und bietet folgende Funktionen:

## Hauptfunktionen

### 1. E-Mails abrufen und synchronisieren
- **Automatische Synchronisation**: Beim Öffnen des E-Mail Clients werden automatisch die letzten 50 E-Mails aus dem Posteingang synchronisiert
- **Manuelle Aktualisierung**: Klicken Sie auf das Refresh-Symbol (🔄) in der oberen Leiste
- **Echtzeit-Updates**: Neue E-Mails werden automatisch angezeigt

### 2. E-Mail-Ordner
- **Posteingang**: Alle eingehenden E-Mails
- **Gesendet**: Alle gesendeten E-Mails
- **Entwürfe**: Gespeicherte E-Mail-Entwürfe
- **Markiert**: Mit Stern markierte E-Mails
- **Archiv**: Archivierte E-Mails
- **Papierkorb**: Gelöschte E-Mails

### 3. E-Mail-Funktionen
- **Lesen**: Klicken Sie auf eine E-Mail, um sie zu öffnen
- **Als gelesen/ungelesen markieren**: Automatisch beim Öffnen
- **Stern hinzufügen/entfernen**: Klick auf das Stern-Symbol
- **Archivieren**: Verschiebt E-Mails ins Archiv
- **Löschen**: Verschiebt E-Mails in den Papierkorb

### 4. E-Mails verfassen
- **Neue E-Mail**: Klicken Sie auf "Neue E-Mail" in der oberen rechten Ecke
- **Antworten**: Klicken Sie auf "Antworten" bei einer geöffneten E-Mail
- **Weiterleiten**: Klicken Sie auf "Weiterleiten" bei einer geöffneten E-Mail

### 5. E-Mail-Vorlagen
Beim Verfassen einer E-Mail können Sie aus folgenden Vorlagen wählen:
- **Angebot**: Für Umzugsangebote
- **Bestätigung**: Für Auftragsbestätigungen
- **Erinnerung**: Für Terminerinnerungen

### 6. Als Kunde importieren
- Klicken Sie auf "Als Kunde importieren" bei einer E-Mail
- Das System erkennt automatisch:
  - Name und Kontaktdaten
  - Umzugsdaten (Von/Nach Adressen)
  - Wohnungsdetails
  - Gewünschte Services
- Überprüfen Sie die Daten und bestätigen Sie den Import

## Technische Details

### Synchronisation
- E-Mails werden über IMAP von imap.ionos.de abgerufen
- Gesendete E-Mails werden über SMTP an smtp.ionos.de gesendet
- Alle E-Mails werden in Firebase Firestore zwischengespeichert

### Sicherheit
- Alle Verbindungen sind SSL/TLS verschlüsselt
- E-Mail-Zugangsdaten sind sicher in Cloud Functions gespeichert
- Nur authentifizierte Benutzer haben Zugriff

## Fehlerbehebung

### E-Mails werden nicht angezeigt
1. Klicken Sie auf das Refresh-Symbol
2. Prüfen Sie Ihre Internetverbindung
3. Melden Sie sich ab und wieder an

### E-Mail kann nicht gesendet werden
1. Überprüfen Sie, ob alle Pflichtfelder ausgefüllt sind
2. Prüfen Sie die E-Mail-Adresse des Empfängers
3. Versuchen Sie es erneut nach einigen Sekunden

### Performance-Probleme
- Der erste Ladevorgang kann etwas länger dauern
- Große E-Mails mit vielen Anhängen können langsamer laden
- Reduzieren Sie die Anzahl der synchronisierten E-Mails wenn nötig

## Weitere Entwicklung
Folgende Funktionen sind geplant:
- Vollständige Anhang-Unterstützung
- Erweiterte Suchfunktionen
- E-Mail-Regeln und Filter
- Automatische Kategorisierung