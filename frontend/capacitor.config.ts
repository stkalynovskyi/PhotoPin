import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'PhotoPin',      
  webDir: 'www',
  server: {
    cleartext: true, 
    androidScheme: 'http' 
  },
  plugins: {
    CapacitorHttp: {
      enabled: false, 
    },
  },
};

export default config;
