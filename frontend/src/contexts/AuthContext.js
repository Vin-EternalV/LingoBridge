import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/storage';
import * as authApi from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          // Verify token by fetching user profile
          const userData = await authApi.getMe();
          setTokenState(storedToken);
          setUser({ ...userData.user, profile: userData.profile });
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.log('Restoring token failed', e);
        await removeToken();
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data.token) {
      await setToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const register = async (firstName, lastName, email, password) => {
    const data = await authApi.register(firstName, lastName, email, password);
    if (data.token) {
      await setToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const logout = async () => {
    await removeToken();
    setTokenState(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
