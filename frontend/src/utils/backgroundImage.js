// Picks a picture from the phone's gallery (or the computer, on web) and remembers it on this device.
// Native: the picture is copied into the app's own folder so it survives cache clean-ups.
// Web: the picture is shrunk to at most 1600px and stored in the browser as a data URL.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const KEY = 'lingobridge_bg_image';
const MAX_WEB_SIZE = 1600;

export const loadBackgroundImageUri = async () => {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
};

const deleteNativeFile = async (uri) => {
  if (Platform.OS === 'web' || !uri || !uri.startsWith('file') || !uri.includes('background-')) return;
  try {
    const FileSystem = require('expo-file-system');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    // Nothing to clean up.
  }
};

const downscaleWeb = (uri) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_WEB_SIZE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('That file could not be read as a picture.'));
    img.src = uri;
  });

// Opens the picker. Returns a URI that can be saved, or null if the person cancelled.
export const pickBackgroundImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets || !result.assets.length) return null;

  const asset = result.assets[0];
  if (Platform.OS === 'web') return downscaleWeb(asset.uri);

  const FileSystem = require('expo-file-system');
  const destination = `${FileSystem.documentDirectory}background-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: asset.uri, to: destination });
  return destination;
};

const clearBackgroundImage = async () => {
  const previous = await loadBackgroundImageUri();
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
  await deleteNativeFile(previous);
};

// image: { uri, text } | null. Stores/removes the picture and returns the value to keep in the prefs.
export const applyBackgroundImage = async (image) => {
  if (!image) {
    await clearBackgroundImage();
    return null;
  }
  const previous = await loadBackgroundImageUri();
  try {
    await AsyncStorage.setItem(KEY, image.uri);
  } catch (e) {
    throw new Error('That picture is too big to save. Try a smaller one.');
  }
  if (previous && previous !== image.uri) await deleteNativeFile(previous);
  return { text: image.text === 'light' ? 'light' : 'dark' };
};

export const removeBackgroundImage = clearBackgroundImage;

// Builds { uri, text } for the pickers from the saved prefs (or null when no picture is set).
export const loadBackgroundImageState = async (prefs) => {
  if (!prefs || !prefs.backgroundImage) return null;
  const uri = await loadBackgroundImageUri();
  return uri ? { uri, text: prefs.backgroundImage.text === 'light' ? 'light' : 'dark' } : null;
};

export const sameImage = (a, b) => (a?.uri || null) === (b?.uri || null) && (a?.text || null) === (b?.text || null);
