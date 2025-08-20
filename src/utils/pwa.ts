// PWA Utilities for Relocato
// Handles service worker registration, installation prompts, and offline functionality

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private isOnline = navigator.onLine;
  private offlineQueue: Array<{ url: string; method: string; data: any }> = [];

  constructor() {
    this.init();
  }

  private init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineHandling();
    this.setupNotifications();
  }

  // Service Worker Registration
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        console.log('[PWA] Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          }
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  // Install Prompt Management
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstallSuccess();
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  // Offline Handling
  private setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineQueue();
      this.showOnlineNotification();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineNotification();
    });
  }

  // Push Notifications Setup
  private setupNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // Request permission on user interaction
      document.addEventListener('click', this.requestNotificationPermission.bind(this), { once: true });
    }
  }

  // Public Methods
  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  public isAppInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public isAppOnline(): boolean {
    return this.isOnline;
  }

  // Offline Queue Management
  public addToOfflineQueue(url: string, method: string = 'GET', data?: any) {
    this.offlineQueue.push({ url, method, data });
    localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));
  }

  private async syncOfflineQueue() {
    const storedQueue = localStorage.getItem('pwa-offline-queue');
    if (storedQueue) {
      this.offlineQueue = JSON.parse(storedQueue);
    }

    for (const request of this.offlineQueue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: { 'Content-Type': 'application/json' },
          body: request.data ? JSON.stringify(request.data) : undefined
        });

        if (response.ok) {
          console.log('[PWA] Offline request synced:', request.url);
        }
      } catch (error) {
        console.error('[PWA] Failed to sync offline request:', error);
      }
    }

    this.offlineQueue = [];
    localStorage.removeItem('pwa-offline-queue');
  }

  // Notification Methods
  private async requestNotificationPermission() {
    // Check if Notification API is available
    if (typeof Notification === 'undefined' || !('Notification' in window)) {
      console.log('[PWA] Notifications not supported on this device');
      return;
    }
    
    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('[PWA] Notification permission granted');
          this.setupPushSubscription();
        }
      } catch (error) {
        console.log('[PWA] Failed to request notification permission:', error);
      }
    }
  }

  private async setupPushSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      console.log('[PWA] Push subscription created:', subscription);
      
      // Send subscription to server
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
    }
  }

  // UI Notification Methods
  private showInstallButton() {
    const event = new CustomEvent('pwa:installable', { 
      detail: { canInstall: true } 
    });
    window.dispatchEvent(event);
  }

  private hideInstallButton() {
    const event = new CustomEvent('pwa:installable', { 
      detail: { canInstall: false } 
    });
    window.dispatchEvent(event);
  }

  private showInstallSuccess() {
    const event = new CustomEvent('pwa:installed');
    window.dispatchEvent(event);
  }

  private showUpdateAvailable() {
    const event = new CustomEvent('pwa:updateAvailable');
    window.dispatchEvent(event);
  }

  private showOnlineNotification() {
    const event = new CustomEvent('pwa:online');
    window.dispatchEvent(event);
  }

  private showOfflineNotification() {
    const event = new CustomEvent('pwa:offline');
    window.dispatchEvent(event);
  }

  private handleServiceWorkerMessage(data: any) {
    if (data.type === 'CACHE_UPDATED') {
      console.log('[PWA] Cache updated:', data.payload);
    } else if (data.type === 'BACKGROUND_SYNC') {
      console.log('[PWA] Background sync completed:', data.payload);
    }
  }

  // Utility Methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Analytics
  public trackPWAUsage(action: string, details?: any) {
    console.log('[PWA Analytics]', action, details);
    
    // Track PWA-specific events
    const event = new CustomEvent('pwa:analytics', {
      detail: { action, details, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  // App Shortcuts
  public getAppShortcuts() {
    return [
      {
        name: 'Neues Angebot',
        url: '/search-customer',
        description: 'Erstelle ein neues Angebot für einen Kunden'
      },
      {
        name: 'Kundenliste',
        url: '/customers',
        description: 'Alle Kunden anzeigen und verwalten'
      },
      {
        name: 'Sales Dashboard',
        url: '/quotes',
        description: 'Verkaufs-Dashboard und Analysen anzeigen'
      }
    ];
  }

  // Share API
  public async shareContent(title: string, text: string, url?: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        this.trackPWAUsage('share_success');
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[PWA] Share failed:', error);
          this.trackPWAUsage('share_error', { error: (error as Error).message });
        }
        return false;
      }
    } else {
      // Fallback to clipboard
      if (navigator.clipboard && url) {
        try {
          await navigator.clipboard.writeText(url);
          this.trackPWAUsage('clipboard_copy');
          return true;
        } catch (error) {
          console.error('[PWA] Clipboard copy failed:', error);
          return false;
        }
      }
      return false;
    }
  }
}

// Create singleton instance
const pwaManager = new PWAManager();

export default pwaManager;

// Export types for TypeScript
export type { BeforeInstallPromptEvent };