# AR Room Scanning Implementation Plan

## Übersicht
Implementierung eines professionellen AR Room Scanning Features wie bei MagicPlan, Polycam oder Cupix.

## Ziel
- Benutzer läuft mit iPhone/iPad durch den Raum
- AR erkennt automatisch Wände, Boden, Decke
- Berechnet automatisch Raumvolumen
- Erkennt Möbel und deren Volumen
- Generiert 3D-Modell des Raums

## Technologie-Stack

### Option 1: Native iOS App mit ARKit RoomPlan (Empfohlen)
```swift
// iOS 16+ erforderlich
import RoomPlan

let roomCaptureSession = RoomCaptureSession()
// Automatisches Scanning mit UI-Feedback
```

**Vorteile:**
- Professionelle Qualität
- Automatische Raumerkennung
- Möbelerkennung inklusive
- Export als USDZ/USD

**Nachteile:**
- Nur iOS 16+ (iPhone 12 Pro oder neuer mit LiDAR)
- Native App erforderlich

### Option 2: WebXR mit Fallback
```javascript
// Progressive Web App Ansatz
if ('xr' in navigator) {
  // WebXR für moderne Browser
  const session = await navigator.xr.requestSession('immersive-ar');
} else {
  // Fallback zu WebRTC + Computer Vision
}
```

### Option 3: Third-Party SDKs

#### Matterport Capture SDK
- Kosten: $49-99/Monat
- Professionelle 3D-Scans
- Cloud-Processing
- Web-Viewer inklusive

#### 8th Wall
- Kosten: $99+/Monat  
- Web-basiertes AR
- Kein App-Download nötig
- Cross-Platform

#### Immersal SDK
- Kosten: Enterprise Pricing
- Persistent Cloud Anchors
- Multi-User Sessions

## Implementation Steps

### Phase 1: ARKit RoomPlan Integration (2-3 Wochen)
1. Native iOS Module erstellen
2. RoomPlan API integrieren
3. React Native Bridge bauen
4. UI für Scan-Guidance

### Phase 2: Datenverarbeitung (1-2 Wochen)
1. 3D-Modell zu Volumen konvertieren
2. Möbel-Erkennung verbessern
3. Supabase Storage für 3D-Modelle

### Phase 3: Web-Viewer (1 Woche)
1. Three.js Integration
2. 3D-Modell Viewer
3. Maße und Annotationen

## Beispiel-Apps zur Inspiration

### MagicPlan
- Automatische Grundrisserstellung
- Möbel-Katalog
- PDF/CAD Export

### Polycam
- LiDAR-basiertes Scanning
- Photogrammetrie-Fallback
- Cloud-Processing

### Canvas.io
- Professionelles Vermessen
- CAD-Integration
- $30/Scan

### RoomScan Pro
- Einfaches Walk-Through
- Automatische Wanderkennung
- Grundriss-Export

## Code-Beispiel: ARKit RoomPlan

```swift
import RoomPlan
import ARKit

class RoomScanner: RoomCaptureSessionDelegate {
    let captureSession = RoomCaptureSession()
    
    func startScanning() {
        captureSession.delegate = self
        
        let config = RoomCaptureSession.Configuration()
        config.isCoachingEnabled = true
        
        captureSession.run(configuration: config)
    }
    
    // Automatische Raumerkennung
    func captureSession(_ session: RoomCaptureSession, 
                       didUpdate room: CapturedRoom) {
        // Wände, Boden, Decke, Möbel automatisch erkannt
        let volume = calculateVolume(from: room)
        let furniture = room.objects // Erkannte Möbel
        
        // An React Native senden
        sendToReactNative([
            "volume": volume,
            "furniture": furniture.map { $0.dimensions },
            "floorPlan": room.parametricModel
        ])
    }
}
```

## Kosten-Nutzen-Analyse

### Entwicklungskosten
- ARKit RoomPlan: 3-4 Wochen Entwicklung
- Third-Party SDK: 1-2 Wochen + Lizenzkosten
- Eigene Computer Vision: 8-12 Wochen

### Empfehlung
1. **Kurzfristig**: 8th Wall für Web-AR (schnellste Lösung)
2. **Mittelfristig**: Native iOS App mit ARKit RoomPlan
3. **Langfristig**: Eigene Computer Vision Lösung

## Nächste Schritte
1. Entscheidung über Technologie-Stack
2. Proof of Concept entwickeln
3. User Testing mit echten Umzugskunden
4. Iterative Verbesserung