import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { WebBridgeMessage } from '../types/ar';

const { WebBridgeModule } = NativeModules;
const webBridgeEmitter = new NativeEventEmitter(WebBridgeModule);

export class WebBridge {
  private static listeners: Map<string, any> = new Map();
  private static webViewRef: any = null;

  static initialize(webViewRef: any) {
    this.webViewRef = webViewRef;
    this.setupListeners();
  }

  private static setupListeners() {
    // Listen for messages from web app
    webBridgeEmitter.addListener('WebMessage', (message: any) => {
      this.handleWebMessage(message);
    });
  }

  static sendMessage(message: WebBridgeMessage) {
    if (this.webViewRef) {
      const script = `
        window.postMessage(${JSON.stringify(message)}, '*');
        true;
      `;
      this.webViewRef.injectJavaScript(script);
    }
    
    // Also send via native module for app extensions
    if (WebBridgeModule && WebBridgeModule.sendMessage) {
      WebBridgeModule.sendMessage(JSON.stringify(message));
    }
  }

  private static handleWebMessage(message: any) {
    try {
      const parsed = JSON.parse(message);
      const { type, data } = parsed;
      
      // Notify listeners
      if (this.listeners.has(type)) {
        const listener = this.listeners.get(type);
        listener(data);
      }
    } catch (error) {
      console.error('Error handling web message:', error);
    }
  }

  static onMessage(type: string, callback: (data: any) => void) {
    this.listeners.set(type, callback);
  }

  static offMessage(type: string) {
    this.listeners.delete(type);
  }

  static async syncWithWebApp(sessionData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Send session data
      this.sendMessage({
        type: 'session',
        data: sessionData,
        timestamp: new Date().toISOString()
      });

      // Wait for acknowledgment
      const timeout = setTimeout(() => {
        reject(new Error('Sync timeout'));
      }, 5000);

      this.onMessage('sync_ack', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  static cleanup() {
    this.listeners.clear();
    webBridgeEmitter.removeAllListeners('WebMessage');
  }
}