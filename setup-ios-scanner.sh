#!/bin/bash

# Setup script für RELOCATO Scanner iOS App

echo "🚀 Erstelle RELOCATO Scanner App..."

# Create React Native App
npx react-native init RelocatoScanner --template react-native-template-typescript

cd RelocatoScanner

# Install dependencies
echo "📦 Installiere Dependencies..."
npm install react-native-webview @react-navigation/native @react-navigation/stack react-native-safe-area-context react-native-screens react-native-gesture-handler

# Install Supabase
npm install @supabase/supabase-js

# Create app structure
mkdir -p src/components src/services src/screens

# Podfile update für iOS 16
cat > ios/Podfile << 'EOF'
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '16.0'
install! 'cocoapods', :deterministic_uuids => false

target 'RelocatoScanner' do
  config = use_native_modules!

  # Flags change depending on the env values.
  flags = get_default_flags()

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => flags[:hermes_enabled],
    :fabric_enabled => flags[:fabric_enabled],
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # Add RoomPlan
  pod 'RoomPlan', :modular_headers => true

  target 'RelocatoScannerTests' do
    inherit! :complete
  end
end
EOF

echo "✅ Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. cd RelocatoScanner"
echo "2. cd ios && pod install"
echo "3. Öffnen Sie RelocatoScanner.xcworkspace in Xcode"
echo "4. Fügen Sie die Swift-Dateien aus /ios/RoomScanner hinzu"
echo "5. Aktivieren Sie Swift Bridging Header"
echo "6. Build & Run auf einem iPhone mit iOS 16+"