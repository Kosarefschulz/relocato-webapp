# iOS App für AR Room Scanning - Interne Nutzung

## Übersicht
Sie brauchen eine iOS App für AR Room Scanning, aber KEINE App Store Veröffentlichung.

## Optionen für interne Verteilung:

### Option 1: TestFlight (Empfohlen)
- **Bis zu 10.000 Tester**
- **90 Tage gültig** (dann neu hochladen)
- **Kein App Store Review nötig**
- **Einfache Installation per Link**

### Option 2: Ad-hoc Distribution
- **Bis zu 100 Geräte**
- **1 Jahr gültig**
- **Geräte müssen registriert werden**

### Option 3: Enterprise Distribution
- **Unbegrenzte Geräte**
- **Benötigt Apple Enterprise Account** ($299/Jahr)

## Implementierung: Hybrid-Lösung

### Konzept:
1. Web-App bleibt Hauptanwendung
2. iOS App nur für AR-Scanning
3. Deep Linking zwischen Apps

### Workflow:
```
Web-App → "Volumen scannen" → iOS App öffnet sich → Scan → Daten zurück zur Web-App
```

## Setup-Schritte:

### 1. iOS App erstellen
```bash
# Minimale iOS App nur für AR
npx create-react-native-app RelocatoScanner --template blank-typescript
cd RelocatoScanner
```

### 2. Dependencies installieren
```bash
npm install react-native-webview
npm install @react-navigation/native
npm install react-native-safe-area-context
npm install react-native-screens
cd ios && pod install
```

### 3. Info.plist konfigurieren
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>relocato</string>
        </array>
    </dict>
</array>
```

### 4. Deep Linking Setup

#### Web-App (JavaScript):
```javascript
const startARScan = (customerId) => {
  const appUrl = `relocato://scan/${customerId}`;
  const webFallback = 'https://apps.apple.com/app/relocato-scanner';
  
  // Try to open app
  window.location.href = appUrl;
  
  // Fallback if app not installed
  setTimeout(() => {
    if (document.hidden) return;
    alert('Bitte installieren Sie die RELOCATO Scanner App');
  }, 2500);
};
```

#### iOS App (Swift):
```swift
// Handle deep link
func application(_ app: UIApplication, open url: URL) -> Bool {
    if url.scheme == "relocato" && url.host == "scan" {
        let customerId = url.lastPathComponent
        // Start AR scan with customerId
        return true
    }
    return false
}
```

### 5. Daten zurück zur Web-App

#### Option A: URL Scheme
```swift
let resultsUrl = "https://app.relocato.de/scan-complete?data=\(encodedData)"
UIApplication.shared.open(URL(string: resultsUrl)!)
```

#### Option B: Shared Supabase
```swift
// Upload results to Supabase
let supabase = SupabaseClient(url: "...", key: "...")
supabase.from("room_scans").insert(scanData)
```

## Minimale App Features:

1. **Splash Screen** mit RELOCATO Logo
2. **AR Scanner View** (RoomPlan)
3. **Results Upload** zu Supabase
4. **Auto-Return** zur Web-App

## TestFlight Setup:

1. **Apple Developer Account** ($99/Jahr - haben Sie vermutlich schon)
2. **App in App Store Connect** erstellen (aber nicht submitten)
3. **TestFlight Build** hochladen
4. **Interne Tester** hinzufügen (bis zu 100)
5. **Öffentlicher Link** für bis zu 10.000 Tester

## Vorteile dieser Lösung:

- ✅ Keine App Store Veröffentlichung nötig
- ✅ Nutzer bleiben hauptsächlich in Web-App
- ✅ AR-Funktion nur bei Bedarf
- ✅ Einfache Updates über TestFlight
- ✅ Kein App Store Review Process

## Code für Minimale iOS App:

### App.tsx
```typescript
import React, { useEffect } from 'react';
import { View, Text, Button, Linking } from 'react-native';
import { RoomScanner } from './RoomScanner';

export default function App() {
  useEffect(() => {
    // Handle deep links
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });
    
    Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
  }, []);
  
  const handleDeepLink = (url: string) => {
    // Parse relocato://scan/customerId
    const match = url.match(/scan\/(.+)/);
    if (match) {
      const customerId = match[1];
      // Start scan with customerId
    }
  };
  
  return <RoomScanner />;
}
```

Die App ist minimal und dient nur als "AR Scanner Companion" zur Web-App!