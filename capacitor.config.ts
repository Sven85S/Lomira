import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lomira.app',
  appName: 'Lomira',
  webDir: 'dist',
  plugins: {
    // iOS defaults to "native", which resizes the whole WKWebView (and therefore
    // every vh/dvh value) when the keyboard shows — that's what was making the
    // entire app shell jump when typing in Settings. "none" leaves the WebView's
    // size untouched; the focused input still scrolls into view above the
    // keyboard on its own, but nothing else in the layout has to reflow.
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
