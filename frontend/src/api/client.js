import axios from 'axios';
import { API_URL } from '../constants/config';
import { getToken, removeToken } from '../utils/storage';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

client.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error, e.g., clear token and logout
      await removeToken();
      // Lets AuthContext return to the login screen instead of leaving a signed-in shell
      // whose every request fails (for example after "Sign out of all devices").
      if (unauthorizedHandler) unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export const get = (url, config = {}) => client.get(url, config);
export const post = (url, data, config = {}) => client.post(url, data, config);
export const put = (url, data, config = {}) => client.put(url, data, config);
export const del = (url, config = {}) => client.delete(url, config);

export default client;
