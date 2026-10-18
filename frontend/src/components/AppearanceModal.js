import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackgroundColorPicker from './BackgroundColorPicker';
import BackgroundImagePicker from './BackgroundImagePicker';
import { applyBackgroundImage, loadBackgroundImageState, sameImage } from '../utils/backgroundImage';
import Button from './Button';
import { loadAppearancePrefs, saveAppearancePrefs, reloadApp } from '../utils/appearance';
import { confirmAction } from '../utils/dialog';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

// Lets admin and superadmin (who have no Profile screen) pick a background color.
const AppearanceModal = ({ visible, onClose }) => {
  const [prefs, setPrefs] = useState(null);
  const [color, setColor] = useState(null);
  const [image, setImage] = useState(null);
  const [savedImage, setSavedImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    loadAppearancePrefs().then(async (p) => {
      const stored = await loadBackgroundImageState(p);
      setPrefs(p);
      setColor(p.backgroundColor || null);
      setImage(stored);
      setSavedImage(stored);
    });
  }, [visible]);

  const dirty = !!prefs && ((color || null) !== (prefs.backgroundColor || null) || !sameImage(image, savedImage));

  const handleApply = async () => {
    let imagePrefs;
    try {
      imagePrefs = await applyBackgroundImage(image);
    } catch (e) {
      setError(e.message);
      return;
    }
    await saveAppearancePrefs({ ...prefs, backgroundColor: color, backgroundImage: imagePrefs });
    onClose();
    const restart = await confirmAction(
      'Restart to apply',
      'LingoBridge needs to restart to apply your background. Restart now?',
      { confirmText: 'Restart now' }
    );
    if (restart) reloadApp();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Background</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.hint}>
              Pick a color, or use a picture from your gallery or computer. A picture replaces the color.
            </Text>
            <Text style={styles.section}>Color</Text>
            <BackgroundColorPicker value={color} onChange={setColor} />
            <Text style={styles.section}>Picture</Text>
            <BackgroundImagePicker image={image} onChange={setImage} />
            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
          <View style={styles.actions}>
            <Button title="Cancel" variant="text" onPress={onClose} />
            <Button title="Apply" onPress={handleApply} disabled={!dirty} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  title: { ...FONTS.h3 },
  hint: { ...FONTS.small, marginBottom: SPACING.base },
  section: { ...FONTS.h4, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  error: { ...FONTS.small, color: COLORS.error, marginTop: SPACING.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.base },
});

export default AppearanceModal;
