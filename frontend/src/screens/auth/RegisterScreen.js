import React, { useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errors";
import { FONTS, SPACING } from "../../constants/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED_EMAIL_TLDS = new Set(["test", "example", "invalid", "localhost", "local"]);

const hasPublicEmailDomain = (email) => {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  return ![...RESERVED_EMAIL_TLDS].some(
    (tld) => domain === tld || domain.endsWith(`.${tld}`),
  );
};

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const handleRegister = async () => {
    if (loading) return; // Enter pressed twice
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim();
    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (normalizedFirstName.length > 50 || normalizedLastName.length > 50) {
      setError("Names must be 50 characters or fewer.");
      return;
    }
    if (
      normalizedEmail.length > 254 ||
      !EMAIL_PATTERN.test(normalizedEmail) ||
      !hasPublicEmailDomain(normalizedEmail)
    ) {
      setError("Please use a valid email address with a public domain.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await register(
        normalizedFirstName,
        normalizedLastName,
        normalizedEmail,
        password,
      );
      if (data?.otpRequired) {
        navigation.navigate("VerifyOtp", {
          challenge: data.challenge,
          email: data.email,
          purpose: data.purpose,
          resendIn: data.resendIn,
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth={520}>
      <ErrorMessage message={error} />
      <View style={styles.nameContainer}>
        <View style={styles.halfWidth}>
          <Input
            label="First Name"
            placeholder="John"
            value={firstName}
            onChangeText={setFirstName}
            maxLength={50}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
        </View>
        <View style={styles.halfWidth}>
          <Input
            ref={lastNameRef}
            label="Last Name"
            placeholder="Doe"
            value={lastName}
            onChangeText={setLastName}
            maxLength={50}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </View>
      </View>
      <Input
        ref={emailRef}
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
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed-outline"
        secureTextEntry
        maxLength={72}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <Text style={styles.hint}>
        Password must be 8-72 characters long.
      </Text>
      <Input
        ref={confirmRef}
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        icon="lock-closed-outline"
        secureTextEntry
        maxLength={72}
        returnKeyType="go"
        onSubmitEditing={handleRegister}
      />
      <Button
        title="Create Account"
        onPress={handleRegister}
        fullWidth
        loading={loading}
        style={styles.registerButton}
      />
      <Button
        title="Already have an account? Log In"
        variant="text"
        onPress={() => navigation.navigate("Login")}
        fullWidth
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  nameContainer: { flexDirection: "row", justifyContent: "space-between" },
  halfWidth: { width: "48%" },
  hint: {
    ...FONTS.tiny,
    marginBottom: SPACING.base,
    marginTop: -SPACING.sm,
  },
  registerButton: { marginTop: SPACING.lg, marginBottom: SPACING.lg },
});

export default RegisterScreen;
