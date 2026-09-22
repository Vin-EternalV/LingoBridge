// src/constants/config.js
import { Platform } from "react-native";

const getDefaultApiUrl = () => {
  if (Platform.OS === "android") {
    // Android emulator maps host machine to 10.0.2.2
    // Real device uses LAN IP (set via .env)
    return `http://10.0.2.2:5000/api`;
  }
  return "http://localhost:5000/api";
};

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl()
).replace(/\/$/, "");

export const APP_NAME = "LingoBridge";
