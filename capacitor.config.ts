import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nextcapital.app',
  appName: 'Next Capital',
  // Use production server instead of bundled web files
  server: {
    url: 'https://nextcapital-production.up.railway.app',
    cleartext: false,
    allowNavigation: [
      'nextcapital-production.up.railway.app',
      '*.payphonetodoesposible.com',
      '*.stripe.com',
      '*.firebaseapp.com',
      '*.firebase.com',
    ],
  },
  webDir: 'out',
  android: {
    backgroundColor: '#05050a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#05050a',
      showSpinner: false,
    },
  },
};

export default config;
