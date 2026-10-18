import React, { useState, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import AuthLayout from "../../components/AuthLayout";
import { resetPassword } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import { FONTS, SPACING } from "../../constants/theme";

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const { updateToken } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const handleReset = async () => {
    if (loading) return; // Enter pressed twice
    setError("");
    if (!code || !password) {
      setError("Enter the code and a new password.");
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await resetPassword(code, password);
      if (data?.token) await updateToken(data.token);
      navigation.navigate("Login");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.intro}>
        We sent a 6-digit code to {email || "your email"}. Enter it below along
        with your new password.
      </Text>
      <ErrorMessage message={error} />
      <Input
        label="Reset code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        ref={passwordRef}
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        maxLength={72}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <Input
        ref={confirmRef}
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        maxLength={72}
        returnKeyType="go"
        onSubmitEditing={handleReset}
      />
      <Button
        title="Reset Password"
        onPress={handleReset}
        loading={loading}
        fullWidth
        style={styles.button}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  intro: { ...FONTS.small, marginBottom: SPACING.lg, lineHeight: 20 },
  button: { marginTop: SPACING.lg },
});

export default ResetPasswordScreen;
