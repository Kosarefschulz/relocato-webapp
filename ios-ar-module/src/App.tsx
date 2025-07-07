import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ARScanner } from './components/ARScanner';
import { WebBridge } from './services/webBridge';
import { ARSession } from './types/ar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEB_APP_URL = 'https://relocato.vercel.app';
// const WEB_APP_URL = 'http://localhost:3001'; // For development

export default function App() {
  const [showARScanner, setShowARScanner] = useState(false);
  const [currentSession, setCurrentSession] = useState<{
    id: string;
    roomName: string;
  } | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    // Initialize web bridge
    WebBridge.initialize(webViewRef.current);

    // Listen for AR scan requests from web app
    WebBridge.onMessage('start_ar_scan', (data) => {
      setCurrentSession({
        id: data.sessionId,
        roomName: data.roomName
      });
      setShowARScanner(true);
    });

    // Listen for session sync requests
    WebBridge.onMessage('request_sessions', async () => {
      const sessions = await loadLocalSessions();
      WebBridge.sendMessage({
        type: 'session',
        data: { sessions },
        timestamp: new Date().toISOString()
      });
    });

    return () => {
      WebBridge.cleanup();
    };
  }, []);

  const loadLocalSessions = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith('ar_session_'));
      const sessions = await AsyncStorage.multiGet(sessionKeys);
      
      return sessions
        .map(([key, value]) => value ? JSON.parse(value) : null)
        .filter(Boolean);
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  };

  const handleARComplete = async (session: ARSession) => {
    setShowARScanner(false);
    
    // Sync with web app
    try {
      await WebBridge.syncWithWebApp(session);
      
      Alert.alert(
        'Scan abgeschlossen',
        `${session.measurements.length} Messungen und ${session.detectedPlanes.length} Objekte erfasst.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(
        'Fehler',
        'Fehler beim Synchronisieren der Daten. Die Daten wurden lokal gespeichert.',
        [{ text: 'OK' }]
      );
    }
    
    setCurrentSession(null);
  };

  const handleARCancel = () => {
    setShowARScanner(false);
    setCurrentSession(null);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      // Handle messages from web app
      switch (message.type) {
        case 'start_ar_scan':
          setCurrentSession({
            id: message.data.sessionId,
            roomName: message.data.roomName
          });
          setShowARScanner(true);
          break;
        case 'get_capabilities':
          // Capabilities will be sent automatically by ARScanner
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing web message:', error);
    }
  };

  if (showARScanner && currentSession) {
    return (
      <ARScanner
        sessionId={currentSession.id}
        roomName={currentSession.roomName}
        onComplete={handleARComplete}
        onCancel={handleARCancel}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScript={`
          // Inject AR capabilities
          window.ARCapabilities = {
            available: true,
            platform: 'ios',
            startARScan: (sessionId, roomName) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'start_ar_scan',
                data: { sessionId, roomName }
              }));
            }
          };
          
          // Notify web app that AR is available
          window.postMessage({ type: 'ar_ready' }, '*');
          true;
        `}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  webView: {
    flex: 1
  }
});