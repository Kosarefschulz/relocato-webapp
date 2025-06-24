# Relocato iOS App Installation

## Voraussetzungen

1. **Xcode installiert** (Version 14 oder höher)
2. **Apple Developer Account** (kostenlos für persönliche Nutzung)
3. **CocoaPods** (optional, aber empfohlen)

## Installation von CocoaPods (empfohlen)

```bash
sudo gem install cocoapods
```

## App auf deinem iPhone installieren

### 1. Xcode-Projekt öffnen

```bash
npx cap open ios
```

Oder manuell:
- Öffne Xcode
- Wähle "Open a project or file"
- Navigiere zu: `/Users/sergejschulz/Desktop/main/umzugs-webapp/ios/App/App.xcworkspace`

### 2. Signing konfigurieren

1. Wähle in Xcode das "App" Target aus
2. Gehe zum "Signing & Capabilities" Tab
3. Aktiviere "Automatically manage signing"
4. Wähle dein Team aus (deine Apple ID)
5. Bundle Identifier: `de.relocato.app` (oder ändere zu deiner eigenen)

### 3. Gerät auswählen

1. Verbinde dein iPhone mit dem Mac
2. Vertraue dem Computer auf deinem iPhone
3. Wähle dein iPhone in der Geräteliste in Xcode aus

### 4. App installieren

1. Klicke auf den "Run" Button (▶️) in Xcode
2. Die App wird gebaut und auf deinem iPhone installiert
3. Beim ersten Mal musst du auf dem iPhone zu:
   - Einstellungen → Allgemein → VPN & Geräteverwaltung
   - Deine Entwickler-App vertrauen

## App aktualisieren

Wenn du Änderungen an der Web-App machst:

```bash
# 1. Änderungen bauen
npm run build

# 2. Mit iOS synchronisieren
npx cap sync ios

# 3. In Xcode erneut ausführen
npx cap open ios
# Dann Run Button drücken
```

## Wichtige Hinweise

### Kostenloser Developer Account
- App läuft **7 Tage**, dann muss sie neu installiert werden
- Maximal 3 Apps gleichzeitig

### Bezahlter Developer Account ($99/Jahr)
- App läuft **1 Jahr**
- Unbegrenzte Apps
- Kann im App Store veröffentlicht werden

## Funktionen der iOS App

✅ Alle Web-Funktionen verfügbar
✅ Kamera-Zugriff für Dokumenten-Scan
✅ Kalender-Import direkt vom iPhone
✅ Push-Benachrichtigungen (mit Konfiguration)
✅ Offline-Fähigkeit (PWA-Cache)
✅ Native Performance

## Troubleshooting

### "Unable to install" Fehler
- Lösche die App vom iPhone
- Clean Build in Xcode: Product → Clean Build Folder
- Neu installieren

### CocoaPods Fehler
```bash
cd ios/App
pod install
```

### Xcode-Simulator Fehler
- Führe aus: `sudo xcodebuild -runFirstLaunch`
- Oder ignoriere und nutze echtes Gerät

## MCP Integration

Die MCP-Server Integration funktioniert auch in der iOS App:
- Dokumenten-Scan mit automatischer Kundenzuordnung
- Firebase-Synchronisation
- Alle Cloud-Funktionen verfügbar