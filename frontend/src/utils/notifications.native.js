export * from './notificationEvents';
import { Platform } from 'react-native';

// Expo Go on Android no longer ships expo-notifications (removed in SDK 53), and merely importing the
// package there logs errors. So the package is never loaded at app start: it is required lazily, only
// when reminders are actually used, and never inside Expo Go on Android.
const isExpoGoAndroid = (() => {
  if (Platform.OS !== 'android') return false;
  try {
    const Constants = require('expo-constants').default;
    return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
  } catch (e) {
    return false;
  }
})();

export const remindersSupported = !isExpoGoAndroid;
export const remindersUnavailableMessage =
  "Reminders can't run in Expo Go on Android (Expo removed notification support there). " +
  'They work in a development build, and on iPhone in Expo Go. You can still save your preferences here.';

const CHANNEL_ID = 'reminders';
let cached; // undefined = not tried yet, null = unavailable

const getNotifications = () => {
  if (!remindersSupported) return null;
  if (cached !== undefined) return cached;
  try {
    const module = require('expo-notifications');
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    cached = module;
  } catch (e) {
    cached = null; // package missing or unsupported in this app
  }
  return cached;
};

export const requestReminderPermission = async () => {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Practice reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted';
};

export const cancelAllReminders = async () => {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Replaces any previously scheduled reminders with the ones in `settings`.
export const applyReminders = async ({ dailyReminder, reminderTime, weeklyReminder }) => {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (dailyReminder) {
    const [hour, minute] = (reminderTime || '18:00').split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to practice',
        body: 'A few minutes of English today keeps your streak going.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  }

  if (weeklyReminder) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your weekly progress',
        body: 'Open LingoBridge to see how you did this week and set your next goal.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 10,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
  }
  return true;
};
