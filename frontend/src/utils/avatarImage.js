// Lets someone pick a profile photo from their gallery (or computer on web) and returns it as a small
// square JPEG data URL (256x256, roughly 15-40 KB) that is stored on their account.
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const SIZE = 256;

// Web: crop the middle square and shrink it with a canvas.
const cropSquareWeb = (uri) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('That file could not be read as a picture.'));
    img.src = uri;
  });

// Returns a data URL, or null if the person cancelled.
export const pickProfilePhoto = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: Platform.OS !== 'web', // phones get a square crop screen
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets || !result.assets.length) return null;

  const asset = result.assets[0];
  if (Platform.OS === 'web') return cropSquareWeb(asset.uri);

  const ImageManipulator = require('expo-image-manipulator');
  const resized = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: SIZE, height: SIZE } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return `data:image/jpeg;base64,${resized.base64}`;
};
