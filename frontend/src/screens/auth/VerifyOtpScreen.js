import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errors";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

// Step two of sign-up and login: the 6-digit code that was emailed to the learner.
// When the code is right, verifyOtp() signs the user in and the app switches screens by itself.
const VerifyOtpScreen = ({ route, navigation }) => {
  const { challenge, email, purpose, resendIn = 60 } = route.params || {};
  const { verifyOtp, resendOtp } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendIn);
  const submitting = useRef(false);

  // Count down until "Resend code" can be used again.
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  // Opened without a challenge (for example a refreshed browser tab): start again from login.
  useEffect(() => {
    if (!challenge) navigation.replace("Login");
  }, [challenge, navigation]);

  const submit = async (value) => {
    if (submitting.current) return; // auto-submit and Enter must not fire twice
    if (!/^\d{6}$/.test(value)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await verifyOtp(challenge, value);
      // Success: AuthContext now has the user, and the navigator replaces this screen.
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed. Please try again."));
      setCode("");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const handleChange = (text) => {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) submit(digits); // submit as soon as the last digit is typed
  };

  const handleResend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      const data = await resendOtp(challenge);
      setInfo("A new code is on its way.");
      setSecondsLeft(data?.resendIn || 60);
      setCode("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not send a new code."));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.intro}>
        {purpose === "register"
          ? "Almost done! We sent a 6-digit code to "
          : "For your security, we sent a 6-digit code to "}
        <Text style={styles.email}>{email || "your email"}</Text>. It expires in 10 minutes.
      </Text>
      <ErrorMessage message={error} />
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <Input
        label="Verification code"
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
        autoFocus
        returnKeyType="go"
        onSubmitEditing={() => submit(code)}
      />
      <Button
        title="Verify"
        onPress={() => submit(code)}
        fullWidth
        loading={loading}
        disabled={code.length !== 6}
        style={styles.verifyButton}
      />
      <Button
        title={secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
        variant="text"
        onPress={handleResend}
        disabled={secondsLeft > 0 || resending}
        loading={resending}
        fullWidth
      />
      <View style={styles.spacer} />
      <Button
        title={purpose === "register" ? "Use a different email" : "Back to log in"}
        variant="text"
        onPress={() => navigation.navigate(purpose === "register" ? "Register" : "Login")}
        fullWidth
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  intro: { ...FONTS.regular, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 22 },
  email: { fontWeight: "600", color: COLORS.text },
  info: { ...FONTS.small, color: COLORS.success, marginBottom: SPACING.md },
  verifyButton: { marginBottom: SPACING.md },
  spacer: { height: SPACING.sm },
});

export default VerifyOtpScreen;
