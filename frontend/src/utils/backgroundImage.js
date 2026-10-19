import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lingobridge_bg_image';

// Remove background images saved by older versions of the app.
export const clearBackgroundImage = async () => {
  let uri = null;
  try {
    uri = await AsyncStorage.getItem(KEY);
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    // Continue with startup if old appearance data cannot be accessed.
  }

  if (Platform.OS === 'web' || !uri || !uri.startsWith('file') || !uri.includes('background-')) return;
  try {
    const FileSystem = require('expo-file-system');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    // The legacy file may already have been removed.
  }
};
