# Relocato AR Scanner iOS Module

This module provides AR scanning capabilities for the Relocato web app using ARKit on iOS devices.

## Features

- **AR Measurements**: Use ARKit to measure furniture dimensions in 3D
- **LiDAR Support**: Enhanced accuracy on iPhone 12 Pro and newer models
- **Furniture Detection**: AI-powered furniture recognition from camera feed
- **Web Integration**: Seamless communication with the Relocato web app
- **Offline Support**: Local storage of scan sessions

## Requirements

- iOS 13.0+
- iPhone 6s or newer (ARKit support)
- iPhone 12 Pro or newer for LiDAR features
- Xcode 14.0+
- React Native 0.72.6+

## Installation

### 1. Install Dependencies

```bash
cd ios-ar-module
npm install
cd ios && pod install
```

### 2. Configure iOS Project

1. Open `ios/RelocatoAR.xcworkspace` in Xcode
2. Select your development team in the project settings
3. Add camera usage description to Info.plist:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Diese App benötigt Kamerazugriff für AR-Messungen</string>
   ```

### 3. Build and Run

```bash
# Run on iOS simulator (AR features limited)
npm run ios

# Run on physical device (recommended)
npm run ios --device
```

## Integration with Web App

The AR module communicates with the web app through a WebView bridge. When the user clicks the AR scan button in the web app:

1. Web app calls `arBridgeService.startARScan()`
2. iOS app launches the AR scanner
3. User performs measurements and scans
4. Data is sent back to the web app via `WebBridge`
5. Web app updates the quote with scan data

## Architecture

```
├── src/
│   ├── components/
│   │   └── ARScanner.tsx      # Main AR UI component
│   ├── services/
│   │   ├── arProcessingService.ts  # AR data processing
│   │   └── webBridge.ts           # Web app communication
│   └── types/
│       └── ar.ts              # TypeScript definitions
├── ios/
│   ├── ARKitManager.swift     # Native ARKit integration
│   └── WebBridgeModule.swift  # Native bridge implementation
└── App.tsx                    # Main app entry point
```

## Usage

### Starting an AR Session

```typescript
// From web app
arBridgeService.startARScan(sessionId, roomName);

// In AR module
const handleStartARScan = async () => {
  await arBridgeService.startARScan(
    `ar_${sessionId}_${Date.now()}`,
    roomName
  );
};
```

### Measurement Types

1. **Distance**: Tap two points to measure distance
2. **Area**: Tap four points to measure area
3. **Volume**: Use furniture detection for automatic volume calculation

### LiDAR Features

On supported devices, LiDAR provides:
- More accurate depth data
- Better furniture edge detection
- Improved volume calculations
- Faster plane detection

## Development

### Testing AR Features

1. **Physical Device**: Required for full AR functionality
2. **Simulator**: Limited AR support, useful for UI testing
3. **Mock Data**: Use `USE_MOCK_AR=true` for development without device

### Debugging

```bash
# View React Native logs
npx react-native log-ios

# View native logs
# Open Xcode → Window → Devices and Simulators → View Device Logs
```

## Deployment

### Building for TestFlight

1. Update version in `package.json` and `ios/RelocatoAR/Info.plist`
2. Archive in Xcode: Product → Archive
3. Upload to App Store Connect
4. Submit for TestFlight review

### Web App Integration

The web app automatically detects AR capabilities:

```typescript
if (arBridgeService.isARAvailable()) {
  // Show AR scan button
}
```

## Troubleshooting

### Common Issues

1. **"AR not available"**: Ensure running on physical device
2. **Camera permission denied**: Check Settings → Privacy → Camera
3. **LiDAR not detected**: Only available on iPhone 12 Pro+
4. **WebView communication failed**: Check network and app permissions

### Performance Tips

- Limit scanning sessions to 5-10 minutes
- Process images on device when possible
- Use LiDAR for large furniture items
- Batch measurements before sending to web app

## Future Enhancements

- [ ] Android ARCore support
- [ ] ML model for furniture type detection
- [ ] Cloud processing for complex scenes
- [ ] Multi-room scanning workflow
- [ ] Export to 3D model formats

## Support

For issues or questions:
- GitHub: https://github.com/relocato/ios-ar-module
- Email: support@relocato.de