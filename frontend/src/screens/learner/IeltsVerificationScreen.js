import React, { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusMessage from '../../components/StatusMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as usersApi from '../../api/users';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';

export default function IeltsVerificationScreen({ navigation }) {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState(null);
  const load = useCallback(async () => {
    try { setVerification(await usersApi.getIdentityVerification()); }
    catch (err) { setMessage({ type: 'error', message: err.response?.data?.message || 'Could not load verification status.' }); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { if (verification && !verification.ageEligible) navigation.replace('LearningProgress'); }, [verification, navigation]);
  const pickDocument = async () => {
    setMessage(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.base64) throw new Error('Could not read this image. Please choose a JPEG, PNG, or WebP image.');
      setSelectedImage({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType || 'image/jpeg' });
    } catch (err) {
      setMessage({ type: 'error', message: err.message || 'Could not select the ID image.' });
    }
  };
  const uploadDocument = async () => {
    if (!selectedImage) return;
    setSaving(true); setMessage(null);
    try {
      await usersApi.uploadIdentityDocument(selectedImage.base64, selectedImage.mimeType);
      setSelectedImage(null);
      setMessage({ type: 'success', message: 'Your ID image was uploaded securely. You can now submit it for review.' });
      await load();
    } catch (err) { setMessage({ type: 'error', message: err.response?.data?.message || 'Could not upload the ID image.' }); }
    finally { setSaving(false); }
  };
  const request = async () => {
    setSaving(true); setMessage(null);
    try { await usersApi.requestIdentityVerification(); setMessage({ type: 'success', message: 'Your ID image and verification request were submitted securely for admin review.' }); await load(); }
    catch (err) { setMessage({ type: 'error', message: err.response?.data?.message || 'Could not submit the request.' }); }
    finally { setSaving(false); }
  };
  if (loading) return <Screen title="IELTS verification"><LoadingSpinner fullScreen message="Checking eligibility..." /></Screen>;
  if (verification && !verification.ageEligible) return null;
  return <Screen title="IELTS verification">
    <StatusMessage type={message?.type} message={message?.message} />
    <Card>
      <View style={styles.titleRow}><Ionicons name="shield-checkmark" size={26} color={COLORS.primary} /><Text style={styles.title}>Age and identity check</Text></View>
      <Text style={styles.copy}>IELTS preparation requires Advanced English, age 18 or older, and admin review of an accepted government-issued ID image (such as a passport, national ID card, or driver's license).</Text>
      <Text style={styles.copy}>Upload a clear image of your ID. It is stored privately for authorized admin review and deleted after the review decision. Do not upload an ID number in a text field.</Text>
      <Text style={styles.copy}>Your date of birth comes from account creation and cannot be edited in your profile.</Text>
      {!!verification && <Text style={styles.status}>Status: {verification.status.replace('_', ' ')}</Text>}
      {verification?.hasIdDocument && <StatusMessage type="success" message="Government ID image uploaded." />}
      {!verification?.levelEligible && <StatusMessage type="info" message="Reach Advanced English before requesting IELTS verification." />}
      {verification?.status === 'pending' && <StatusMessage type="info" message={verification?.hasIdDocument ? 'Your ID image and request are awaiting admin review.' : 'Upload a government ID image to complete this request before an admin can review it.'} />}
      {verification?.status === 'verified' && <StatusMessage type="success" message="Your age and identity have been verified. IELTS is available." />}
      {verification?.status === 'rejected' && <StatusMessage type="error" message="Your ID verification was rejected. Upload a clear image of an accepted government-issued ID to submit a new request." />}
      {verification?.ageEligible && verification?.levelEligible && verification?.status !== 'verified' && (verification?.status !== 'pending' || !verification?.hasIdDocument) && <>
        <Button title={verification?.hasIdDocument ? 'Choose a different ID image' : 'Choose government ID image'} variant="secondary" onPress={pickDocument} disabled={saving} fullWidth />
        {selectedImage && <View style={styles.previewWrap}>
          <Image source={{ uri: selectedImage.uri }} style={styles.preview} resizeMode="contain" />
          <Text style={styles.copy}>Selected ID image</Text>
          <Button title="Upload ID image" onPress={uploadDocument} loading={saving} disabled={saving} fullWidth />
        </View>}
        {verification?.hasIdDocument && verification?.status !== 'pending' && <Button title="Submit for review" onPress={request} loading={saving} disabled={saving} fullWidth style={styles.button} />}
      </>}
      <Button title="Back to learning" variant="secondary" onPress={() => navigation.goBack()} fullWidth style={styles.button} />
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.base },
  title: { ...FONTS.h3 },
  copy: { ...FONTS.small, lineHeight: 21, marginBottom: SPACING.base },
  status: { ...FONTS.regular, textTransform: 'capitalize', fontWeight: '600', marginBottom: SPACING.base },
  button: { marginTop: SPACING.sm },
  previewWrap: { marginTop: SPACING.base, marginBottom: SPACING.sm },
  preview: { width: '100%', height: 220, borderRadius: 10, backgroundColor: '#f2f4f7' },
});
