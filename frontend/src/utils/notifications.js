// Web version. Reminders are not supported in the browser, so those functions do nothing.
export * from './notificationEvents';

export const remindersSupported = false;
export const remindersUnavailableMessage =
  'Reminders are only available in the mobile app. You can still save your preferences here.';

export const requestReminderPermission = async () => false;
export const cancelAllReminders = async () => {};
export const applyReminders = async () => false;