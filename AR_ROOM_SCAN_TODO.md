# AR Room Scan - Implementierung (AUFGESCHOBEN)

## Status: 🟡 Vorbereitet aber deaktiviert

## Was wurde bereits vorbereitet:

### 1. Native iOS Module
- ✅ `RoomScannerModule.swift` - ARKit RoomPlan Integration
- ✅ `RoomScannerBridge.m` - React Native Bridge
- ✅ `RoomScannerNative.tsx` - React Native Component
- ✅ `RoomScannerView.tsx` - Web View Component

### 2. Setup-Dateien
- ✅ `setup-ios-scanner.sh` - Automatisches Setup-Script
- ✅ `Info.plist` - iOS Permissions
- ✅ `IOS_APP_INTERNAL_SETUP.md` - Komplette Anleitung

### 3. Integration vorbereitet
- ✅ Deep Linking Konzept
- ✅ TestFlight Distribution Plan
- ✅ Datenübertragung Web ↔ iOS App

## Was noch zu tun ist:

### Phase 1: iOS App erstellen
```bash
# Wenn bereit, ausführen:
./setup-ios-scanner.sh
```

### Phase 2: Xcode Setup
1. Swift-Dateien hinzufügen
2. Bridging Header aktivieren
3. Signieren & TestFlight

### Phase 3: Web-App aktivieren
1. Button in CustomerDetails wieder sichtbar machen
2. Deep Linking testen
3. Datenübertragung implementieren

## Button vorübergehend versteckt in:
- `CustomerDetails.modern.tsx` - "Volumen scannen" Button

## Aktivierung wenn bereit:
In `CustomerDetails.modern.tsx` den Button-Code ist bereits vorhanden, 
nur auskommentieren wenn die iOS App fertig ist.

## Geschätzter Aufwand:
- iOS App Setup: 2-3 Stunden
- Integration & Tests: 2-3 Stunden
- Gesamt: ~1 Tag

## Notizen:
- Alle Dateien sind vorbereitet und ready-to-use
- Keine Code-Änderungen nötig, nur Setup
- TestFlight ermöglicht Distribution ohne App Store