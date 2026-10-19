import React, { createContext, useState, useContext, useEffect } from "react";
import { getToken, setToken, removeToken } from "../utils/storage";
import * as authApi from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";
import { cancelAllReminders } from "../utils/notifications";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // If the server rejects our token, drop back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUser(null);
      setIsAuthenticated(false);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // On app launch, restore the session and fetch the full user + profile.
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          const userData = await authApi.getMe();
          setTokenState(storedToken);
          setUser({ ...userData.user, profile: userData.profile });
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.log("Restoring token failed", e);
        await removeToken();
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  // Fetches the full user + profile after login / register.
  // This is what makes onboarding status survive a fresh sign-in.
  const hydrateUser = async (fallbackUser) => {
    try {
      const me = await authApi.getMe();
      const merged = { ...me.user, profile: me.profile };
      setUser(merged);
      return merged;
    } catch (e) {
      // If we can't fetch the profile we still let the user in with what we have.
      // AppNavigator will treat a missing profile as "not yet onboarded".
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  // Stores the token and signs the user in. Used by login, register and the OTP step.
  const finishSignIn = async (data) => {
    await setToken(data.token);
    // Populate the full user object BEFORE flipping the auth flag so
    // AppNavigator never renders the onboarding stack for an onboarded learner.
    await hydrateUser(data.user);
    setTokenState(data.token);
    setIsAuthenticated(true);
  };

  // When the server wants an emailed code it answers { otpRequired, challenge, ... } and no token yet.
  // The screen then opens the Verify screen; verifyOtp below finishes the sign-in.
  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data.token) await finishSignIn(data);
    return data;
  };

  const register = async (firstName, lastName, email, password, extra) => {
    const data = await authApi.register(firstName, lastName, email, password, extra);
    if (data.token) await finishSignIn(data);
    return data;
  };

  const verifyOtp = async (challenge, code) => {
    const data = await authApi.verifyOtp(challenge, code);
    if (data.token) await finishSignIn(data);
    return data;
  };

  const resendOtp = (challenge) => authApi.resendOtp(challenge);

  const completeAdminSetup = async (email, code, password) => {
    const data = await authApi.completeAdminSetup(email, code, password);
    if (data.token) await finishSignIn(data);
    return data;
  };

  const logout = async () => {
    try {
      await cancelAllReminders(); // don't leave one learner's reminders on a shared device
    } catch (e) {
      // ignore: reminders are best-effort
    }
    await removeToken();
    setTokenState(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  // Swap in a fresh token (after "sign out of all devices" or a password change)
  // so THIS device stays signed in.
  const updateToken = async (newToken) => {
    if (!newToken) return;
    await setToken(newToken);
    setTokenState(newToken);
  };

  // Re-fetch the account + learning profile so screens show what the server actually saved.
  const refreshUser = async () => {
    const data = await authApi.getMe();
    setUser({ ...data.user, profile: data.profile });
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        verifyOtp,
        resendOtp,
        completeAdminSetup,
        logout,
        updateUser,
        refreshUser,
        updateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
