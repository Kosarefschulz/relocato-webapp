import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.relocato.app',
  appName: 'Relocato',
  webDir: 'build',
  server: {
    cleartext: true,
    allowNavigation: ['*']
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    presentationStyle: 'fullscreen',
    scrollEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#3b82f6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
