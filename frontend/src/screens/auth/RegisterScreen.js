import React, { useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Dropdown from "../../components/Dropdown";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errors";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { LIMITS } from "../../constants/limits";

// Same rule as the server: 7-20 characters, digits, spaces, dashes, brackets, optional leading +
const PHONE_PATTERN = /^\+?[\d\s\-()]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED_EMAIL_TLDS = new Set(["test", "example", "invalid", "localhost", "local"]);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const getBirthYears = () => Array.from({ length: 121 }, (_, index) => String(new Date().getFullYear() - index));
const getBirthMonths = (year) => {
  const today = new Date();
  const monthCount = Number(year) === today.getFullYear() ? today.getMonth() + 1 : MONTHS.length;
  return MONTHS.slice(0, monthCount);
};
const getBirthDays = (year, monthName) => {
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex < 0) return Array.from({ length: 31 }, (_, index) => String(index + 1));
  const today = new Date();
  const yearNumber = Number(year) || 2000; // Leap year keeps February selectable until a year is chosen.
  let dayCount = new Date(Date.UTC(yearNumber, monthIndex + 1, 0)).getUTCDate();
  if (yearNumber === today.getFullYear() && monthIndex === today.getMonth()) {
    dayCount = Math.min(dayCount, today.getDate());
  }
  return Array.from({ length: dayCount }, (_, index) => String(index + 1));
};
const buildBirthDate = (year, monthName, day) => {
  const yearNumber = Number(year);
  const monthNumber = MONTHS.indexOf(monthName) + 1;
  const dayNumber = Number(day);
  const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  const today = new Date();
  const isFuture = yearNumber > today.getFullYear() ||
    (yearNumber === today.getFullYear() && monthNumber > today.getMonth() + 1) ||
    (yearNumber === today.getFullYear() && monthNumber === today.getMonth() + 1 && dayNumber > today.getDate());
  if (!yearNumber || !monthNumber || !dayNumber || date.getUTCFullYear() !== yearNumber || date.getUTCMonth() !== monthNumber - 1 || date.getUTCDate() !== dayNumber || isFuture) return null;
  return `${yearNumber}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
};

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const phoneRef = useRef(null);

  const changeBirthMonth = (month) => {
    setBirthMonth(month);
    if (birthDay && !getBirthDays(birthYear, month).includes(birthDay)) setBirthDay("");
  };

  const changeBirthYear = (year) => {
    const nextMonths = getBirthMonths(year);
    const nextMonth = nextMonths.includes(birthMonth) ? birthMonth : "";
    setBirthYear(year);
    if (nextMonth !== birthMonth) setBirthMonth(nextMonth);
    if (!nextMonth || (birthDay && !getBirthDays(year, nextMonth).includes(birthDay))) setBirthDay("");
  };

  const handleRegister = async () => {
    if (loading) return; // Enter pressed twice
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim();
    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !password || !confirmPassword) {
      setError("Please fill in all required fields (marked with *).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (normalizedFirstName.length > LIMITS.name || normalizedLastName.length > LIMITS.name) {
      setError(`Names must be ${LIMITS.name} characters or fewer.`);
      return;
    }
    const emailDomain = normalizedEmail.slice(normalizedEmail.lastIndexOf("@")).toLowerCase();
    if (normalizedEmail.length > LIMITS.email || !EMAIL_PATTERN.test(normalizedEmail) || [...RESERVED_EMAIL_TLDS].some(tld => emailDomain === `@${tld}` || emailDomain.endsWith(`.${tld}`))) {
      setError("Please use a valid email address with a public domain.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password.length > LIMITS.password) {
      setError(`Password must be ${LIMITS.password} characters or fewer`);
      return;
    }
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      setError("Enter a valid phone number, or leave it empty.");
      return;
    }
    const dateOfBirth = buildBirthDate(birthYear, birthMonth, birthDay);
    if (!dateOfBirth) {
      setError("Enter a valid date of birth.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await register(normalizedFirstName, normalizedLastName, normalizedEmail, password, {
        dateOfBirth,
        phone: phone.trim(),
      });
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
      <Text style={styles.requiredNote}>
        <Text style={styles.asterisk}>*</Text> Required fields
      </Text>
      <View style={styles.nameContainer}>
        <View style={styles.halfWidth}>
          <Input
            label="First Name"
            required
            maxLength={LIMITS.name}
            placeholder="John"
            value={firstName}
            onChangeText={setFirstName}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
        </View>
        <View style={styles.halfWidth}>
          <Input
            ref={lastNameRef}
            label="Last Name"
            required
            maxLength={LIMITS.name}
            placeholder="Doe"
            value={lastName}
            onChangeText={setLastName}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </View>
      </View>
      <Input
        ref={emailRef}
        label="Email"
        required
        maxLength={LIMITS.email}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        ref={passwordRef}
        label="Password"
        required
        maxLength={LIMITS.password}
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed-outline"
        secureTextEntry
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <Text style={styles.hint}>
        Password must be 8 to 72 characters long.
      </Text>
      <Input
        ref={confirmRef}
        label="Confirm Password"
        required
        maxLength={LIMITS.password}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        icon="lock-closed-outline"
        secureTextEntry
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => phoneRef.current?.focus()}
      />

      <Text style={styles.dateLabel}>Date of birth<Text style={styles.requiredMark}> *</Text></Text>
      <View style={styles.birthDateRow}>
        <View style={styles.birthMonth}>
          <Dropdown sheetTitle="Month of birth" value={birthMonth} options={getBirthMonths(birthYear)} onChange={changeBirthMonth} placeholder="Month" searchable={false} />
        </View>
        <View style={styles.birthDay}>
          <Dropdown sheetTitle="Day of birth" value={birthDay} options={getBirthDays(birthYear, birthMonth)} onChange={setBirthDay} placeholder="Day" searchable selectOnSubmit autoFocusSearch searchKeyboardType="numeric" />
        </View>
        <View style={styles.birthYear}>
          <Dropdown sheetTitle="Year of birth" value={birthYear} options={getBirthYears()} onChange={changeBirthYear} placeholder="Year" searchable selectOnSubmit autoFocusSearch searchKeyboardType="numeric" />
        </View>
      </View>

      <Input
        ref={phoneRef}
        label="Phone number"
        optional
        placeholder="e.g. +63 912 345 6789"
        value={phone}
        onChangeText={setPhone}
        icon="call-outline"
        keyboardType="phone-pad"
        maxLength={LIMITS.phone}
        returnKeyType="go"
        blurOnSubmit={false}
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
  requiredNote: { ...FONTS.tiny, marginBottom: SPACING.base },
  dateLabel: { ...FONTS.small, fontWeight: "600", marginBottom: SPACING.xs, color: COLORS.text },
  requiredMark: { color: COLORS.error, fontWeight: "700" },
  birthDateRow: { flexDirection: "row", gap: SPACING.sm },
  birthMonth: { flex: 2 },
  birthDay: { flex: 1 },
  birthYear: { flex: 1.3 },
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
