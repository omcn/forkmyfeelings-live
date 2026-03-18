import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forkmyfeelings.app',
  appName: 'Fork My Feels',
  webDir: 'out',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#fff1f2',
  },
  plugins: {
    Haptics: {
      enabled: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      autoHideDelay: 2000,
      backgroundColor: '#fff1f2',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
    },
  },
  server: {
    // Point to the deployed web app for live/hybrid mode.
    // Remove this block to use the local static export bundled in the app instead.
    url: 'https://forkmyfeelings.com',
  },
};

export default config;
