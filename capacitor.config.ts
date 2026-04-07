import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prism.app',
  appName: 'PRISM',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // For development with live reload, set this to your dev server URL:
    // url: 'http://10.0.2.2:9002', // Android emulator
    // cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#1a1714',
  },
  android: {
    backgroundColor: '#1a1714',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1714',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1714',
    },
  },
};

export default config;
