import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../api/users';
import { pickProfilePhoto } from '../utils/avatarImage';
import { getErrorMessage } from '../utils/errors';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

// Works for every role (learner, admin, superadmin): choose, change or remove your own profile photo.
const ProfilePhotoModal = ({ visible, onClose }) => {
  const { user, updateUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email;

  const save = async (avatar) => {
    await updateProfile({ avatar });
    updateUser({ avatar: avatar || undefined });
  };

  const choose = async () => {
    setBusy(true);
    setError('');
    try {
      const dataUrl = await pickProfilePhoto();
      if (dataUrl) await save(dataUrl);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update your photo. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await save('');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not remove your photo. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile photo</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <Avatar name={fullName} imageUrl={user?.avatar} size={120} />
          </View>

          <Button
            title={user?.avatar ? 'Change photo' : 'Choose photo'}
            onPress={choose}
            loading={busy}
            fullWidth
          />
          {!!user?.avatar && (
            <Button title="Remove photo" variant="text" onPress={remove} disabled={busy} fullWidth />
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button title="Done" variant="outline" onPress={onClose} fullWidth style={styles.done} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  card: { width: '100%', maxWidth: 360, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...FONTS.h3 },
  avatarWrap: { alignItems: 'center', marginVertical: SPACING.lg },
  error: { ...FONTS.small, color: COLORS.error, marginTop: SPACING.sm, textAlign: 'center' },
  done: { marginTop: SPACING.sm },
});

export default ProfilePhotoModal;
