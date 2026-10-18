import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.select({
  web: 'http://localhost:5000/api',
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

// Configure this without source changes in frontend/.env:
// EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
export const APP_NAME = 'LingoBridge';
