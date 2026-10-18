import React, { useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errors";
import { SPACING } from "../../constants/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (loading) return; // Enter pressed twice
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await login(normalizedEmail, password);
      if (data?.otpRequired) {
        navigation.navigate("VerifyOtp", {
          challenge: data.challenge,
          email: data.email,
          purpose: data.purpose,
          resendIn: data.resendIn,
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <ErrorMessage message={error} />
      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
        maxLength={254}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        ref={passwordRef}
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed-outline"
        secureTextEntry
        maxLength={256}
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />
      <View style={styles.forgotPasswordContainer}>
        <Button
          title="Forgot Password?"
          variant="text"
          onPress={() => navigation.navigate("ForgotPassword")}
        />
      </View>
      <Button
        title="Log In"
        onPress={handleLogin}
        fullWidth
        loading={loading}
        style={styles.loginButton}
      />
      <Button
        title="Don't have an account? Sign Up"
        variant="text"
        onPress={() => navigation.navigate("Register")}
        fullWidth
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  forgotPasswordContainer: { alignItems: "flex-end", marginBottom: SPACING.xl },
  loginButton: { marginBottom: SPACING.lg },
});

export default LoginScreen;
