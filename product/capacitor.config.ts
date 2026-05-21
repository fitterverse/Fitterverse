import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.fitterverse.app',
  appName: 'Fitterverse',
  webDir: 'out', 
  server: {
    url: 'https://fitterverse.in', // Back to live site
    cleartext: true
  }
};

export default config;