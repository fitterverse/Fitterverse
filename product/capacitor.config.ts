import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.fitterverse.app',
  appName: 'Fitterverse',
  webDir: 'out', 
  server: {
    // This loads your live website inside the app shell
    url: 'https://fitterverse.in', 
    cleartext: true
  }
};

export default config;