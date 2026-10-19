import React, { useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import StatusMessage from '../../components/StatusMessage';
import { useAuth } from '../../contexts/AuthContext';
import { resendAdminSetupCode } from '../../api/auth';
import { getErrorMessage } from '../../utils/errors';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const AdminSetupScreen = ({ route }) => {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { completeAdminSetup } = useAuth();

  const handleSetup = async () => {
    if (lock.current) return;
    setError('');
    setNotice('');
    if (!email.trim() || !/^\d{6}$/.test(code)) {
      setError('Enter the email address that received the invite and its 6-digit code.');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError('Password must be between 8 and 72 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await completeAdminSetup(email.trim(), code, password);
    } catch (err) {
      lock.current = false;
      setBusy(false);
      setError(getErrorMessage(err, 'Could not set up the administrator account.'));
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter the invited email address first.');
      return;
    }
    setBusy(true);
    try {
      await resendAdminSetupCode(email.trim());
      setNotice('If an administrator invitation is pending for this email, a new code has been sent.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not resend the setup code.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>Set up your administrator account</Text>
      <Text style={styles.copy}>Enter the 6-digit code sent to your email, then choose your own password. When setup succeeds, you’ll be signed in.</Text>
      <ErrorMessage message={error} />
      <StatusMessage message={notice} />
      <Input label="Invited email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={254} />
      <Input label="Email setup code" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
      <Input label="Choose a password" value={password} onChangeText={setPassword} secureTextEntry maxLength={72} />
      <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry maxLength={72} />
      <Button title="Verify code and set password" onPress={handleSetup} loading={busy} disabled={busy} fullWidth />
      <Button title="Resend setup code" variant="text" onPress={handleResend} disabled={busy} fullWidth />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  title: { ...FONTS.h2, color: COLORS.text, marginBottom: SPACING.sm },
  copy: { ...FONTS.regular, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.lg },
});

export default AdminSetupScreen;
