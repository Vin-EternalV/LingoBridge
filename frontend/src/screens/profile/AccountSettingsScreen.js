import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatDate, formatDateTime, roleLabel } from '../../utils/accountInfo';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import Dropdown from '../../components/Dropdown';
import { LANGUAGES } from '../../constants/languages';
import StatusMessage from '../../components/StatusMessage';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatBirthDate = (value) => {
  if (!value) return '—';
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '—';
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const InfoRow = ({ label, value, last }) => (
  <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const AccountSettingsScreen = () => {
  const { user, refreshUser, logout, updateToken } = useAuth();

  // --- Personal details ---
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [detailsStatus, setDetailsStatus] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);

  // --- Language ---
  const [nativeLanguage, setNativeLanguage] = useState(user?.nativeLanguage || '');
  const [prefsStatus, setPrefsStatus] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // --- Password ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // --- Delete account ---
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== (user?.email || '').toLowerCase();
  const detailsChanged =
    firstName.trim() !== (user?.firstName || '') || lastName.trim() !== (user?.lastName || '') || emailChanged;

  // The login response only carries basic details, so load the full account (join date, last sign-in, language).
  useEffect(() => {
    refreshUser().catch(() => {});
  }, []);

  useEffect(() => {
    setNativeLanguage(user?.nativeLanguage || '');
  }, [user?.nativeLanguage]);

  const prefsChanged = nativeLanguage.trim() !== (user?.nativeLanguage || '');

  const handleSavePrefs = async () => {
    setPrefsStatus(null);
    setSavingPrefs(true);
    try {
      await usersApi.updateProfile({ nativeLanguage: nativeLanguage.trim() });
      await refreshUser();
      setPrefsStatus({ type: 'success', message: 'Your native language has been saved.' });
    } catch (err) {
      setPrefsStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveDetails = async () => {
    setDetailsStatus(null);
    if (!firstName.trim() || !lastName.trim()) {
      setDetailsStatus({ type: 'error', message: 'First and last name are required.' });
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setDetailsStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (emailChanged && !emailPassword) {
      setDetailsStatus({ type: 'error', message: 'Enter your current password to change your email.' });
      return;
    }

    setSavingDetails(true);
    try {
      await usersApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        currentPassword: emailChanged ? emailPassword : undefined,
      });
      await refreshUser();
      setEmailPassword('');
      setDetailsStatus({ type: 'success', message: 'Your details have been updated.' });
    } catch (err) {
      setDetailsStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordStatus(null);
    if (!currentPassword || !newPassword) {
      setPasswordStatus({ type: 'error', message: 'Fill in your current and new password.' });
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordStatus({ type: 'error', message: 'New password must be between 8 and 72 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'The new passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const result = await usersApi.updatePassword(currentPassword, newPassword);
      // Changing the password signs out other devices; the server sends a new token for this one.
      await updateToken(result?.data?.token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus({ type: 'success', message: 'Password changed. Other devices have been signed out.' });
    } catch (err) {
      setPasswordStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDelete = async () => {
    setDeleteStatus(null);
    if (!deletePassword) {
      setDeleteStatus({ type: 'error', message: 'Enter your password to confirm.' });
      return;
    }
    const confirmed = await confirmAction(
      'Delete account',
      'This permanently deletes your account, progress and practice history. This cannot be undone.',
      { confirmText: 'Delete', destructive: true }
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await usersApi.deleteAccount(deletePassword);
      await logout();
    } catch (err) {
      setDeleteStatus({ type: 'error', message: getErrorMessage(err) });
      setDeleting(false);
    }
  };

  return (
    <Screen title="Account Settings">
      <SectionLabel>Your account</SectionLabel>
      <Card>
        <InfoRow label="Account type" value={roleLabel(user?.role)} />
        <InfoRow label="Member since" value={formatDate(user?.createdAt)} />
        <InfoRow label="Last sign-in" value={formatDateTime(user?.lastLogin)} last />
      </Card>

      <SectionLabel>Personal details</SectionLabel>
      <StatusMessage type={detailsStatus?.type} message={detailsStatus?.message} />
      <Card>
        <InfoRow label="Date of birth" value={formatBirthDate(user?.dateOfBirth)} last={!user?.phone} />
        {!!user?.phone && <InfoRow label="Phone number" value={user.phone} last />}
        <Input label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <Input label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailChanged && (
          <Input
            label="Current password (required to change email)"
            value={emailPassword}
            onChangeText={setEmailPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
        <Button
          title="Save changes"
          onPress={handleSaveDetails}
          loading={savingDetails}
          disabled={!detailsChanged}
          fullWidth
        />
      </Card>

      <SectionLabel hint="Your tutor can add short explanations in your own language.">
        Language
      </SectionLabel>
      <StatusMessage type={prefsStatus?.type} message={prefsStatus?.message} />
      <Card>
        <Dropdown
          label="Native language"
          value={nativeLanguage}
          options={LANGUAGES}
          onChange={setNativeLanguage}
          placeholder="Choose your language"
          clearLabel="Not set"
        />

        <Button
          title="Save language"
          onPress={handleSavePrefs}
          loading={savingPrefs}
          disabled={!prefsChanged}
          fullWidth
        />
      </Card>

      <SectionLabel>Change password</SectionLabel>
      <StatusMessage type={passwordStatus?.type} message={passwordStatus?.message} />
      <Card>
        <Input
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          maxLength={256}
        />
        <Input
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          maxLength={72}
        />
        <Input
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          maxLength={72}
        />
        <Button
          title="Update password"
          onPress={handleChangePassword}
          loading={savingPassword}
          disabled={!currentPassword || !newPassword || !confirmPassword}
          fullWidth
        />
      </Card>

      <SectionLabel>Danger zone</SectionLabel>
      <View style={styles.dangerCard}>
        <Text style={styles.dangerText}>
          Deleting your account permanently removes your profile, progress and practice history.
        </Text>
        {!showDelete ? (
          <Button
            title="Delete my account"
            variant="outline"
            onPress={() => setShowDelete(true)}
            style={styles.dangerOutline}
            fullWidth
          />
        ) : (
          <View style={styles.deleteForm}>
            <StatusMessage type={deleteStatus?.type} message={deleteStatus?.message} />
            <Input
              label="Enter your password to confirm"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button title="Delete account permanently" variant="danger" onPress={handleDelete} loading={deleting} fullWidth />
            <Button
              title="Cancel"
              variant="text"
              onPress={() => {
                setShowDelete(false);
                setDeletePassword('');
                setDeleteStatus(null);
              }}
              style={styles.cancelLink}
            />
          </View>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { ...FONTS.small },
  infoValue: { ...FONTS.small, color: COLORS.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: SPACING.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.base },
  chip: { marginBottom: SPACING.sm },
  dangerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.errorLight,
    padding: SPACING.base,
  },
  dangerText: { ...FONTS.small, marginBottom: SPACING.md },
  dangerOutline: { borderColor: COLORS.error },
  deleteForm: { marginTop: SPACING.xs },
  cancelLink: { alignSelf: 'center', marginTop: SPACING.md },
});

export default AccountSettingsScreen;
