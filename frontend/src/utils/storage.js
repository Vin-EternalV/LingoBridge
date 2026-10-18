import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'lingobridge_jwt';

export const setToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error saving token', error);
  }
};

export const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error getting token', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing token', error);
  }
};

export const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving item', error);
  }
};

export const getItem = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error getting item', error);
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing item', error);
  }
};
