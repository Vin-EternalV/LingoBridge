import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import AuthLayout from "../../components/AuthLayout";
import { forgotPassword } from "../../api/auth";
import { FONTS, SPACING } from "../../constants/theme";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (loading) return; // Enter pressed twice
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email.trim().toLowerCase());
      navigation.navigate("ResetPassword", {
        email: email.trim().toLowerCase(),
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not send reset code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.instruction}>
        Enter the email address on your account. We'll send a 6-digit code to
        reset your password.
      </Text>
      <ErrorMessage message={error} />
      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />
      <Button
        title="Send Reset Code"
        onPress={handleSend}
        fullWidth
        loading={loading}
        style={styles.button}
      />
      <Button
        title="Back to Log In"
        variant="text"
        onPress={() => navigation.navigate("Login")}
        fullWidth
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  instruction: { ...FONTS.regular, marginBottom: SPACING.xl, lineHeight: 24 },
  button: { marginTop: SPACING.lg, marginBottom: SPACING.lg },
});

export default ForgotPasswordScreen;
