import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  web: 'http://localhost:5000/api',
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

export const API_URL = DEV_API_URL;
export const APP_NAME = 'LingoBridge';
