import { Platform, Share } from 'react-native';

// Hands the learner their data as a JSON file: a download in the browser, the share sheet on a phone.
export const saveJsonFile = async (filename, data) => {
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  }

  const result = await Share.share({ title: filename, message: json });
  return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
};
