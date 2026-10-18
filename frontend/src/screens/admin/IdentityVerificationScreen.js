import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, View, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusMessage from '../../components/StatusMessage';
import * as adminApi from '../../api/admin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function IdentityVerificationScreen() {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);
  const [documents, setDocuments] = useState({});
  const [viewing, setViewing] = useState('');
  const load = useCallback(async () => {
    try { setItems(await adminApi.getIdentityVerifications()); }
    catch (err) { setNotice({ type: 'error', message: err.response?.data?.message || 'Could not load verification requests.' }); setItems([]); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const review = async (userId, status) => {
    setBusy(userId); setNotice(null);
    try { await adminApi.reviewIdentityVerification(userId, status); setNotice({ type: 'success', message: `Request ${status}.` }); setDocuments((current) => { const next = { ...current }; delete next[userId]; return next; }); await load(); }
    catch (err) { setNotice({ type: 'error', message: err.response?.data?.message || 'Could not update this request.' }); }
    finally { setBusy(''); }
  };
  const viewDocument = async (userId) => {
    setViewing(userId); setNotice(null);
    try {
      const document = await adminApi.getIdentityDocument(userId);
      setDocuments((current) => ({ ...current, [userId]: `data:${document.mimeType};base64,${document.base64}` }));
    } catch (err) { setNotice({ type: 'error', message: err.response?.data?.message || 'Could not load the uploaded ID image.' }); }
    finally { setViewing(''); }
  };
  if (!items) return <Screen title="Identity verification"><LoadingSpinner fullScreen message="Loading requests..." /></Screen>;
  return <Screen title="Identity verification">
    <Text style={styles.instructions}>Review the learner's uploaded government-issued ID image and eligibility before approving. ID images are private to authorized admins and deleted after the review decision.</Text>
    <StatusMessage type={notice?.type} message={notice?.message} />
    {!items.length && <Card><Text style={styles.text}>No verification requests yet.</Text></Card>}
    {items.map((item) => <Card key={item.userId}>
      <View style={styles.row}><Ionicons name="person-circle-outline" size={24} color={COLORS.primary} /><Text style={styles.name}>{item.firstName} {item.lastName}</Text></View>
      <Text style={styles.text}>{item.email}</Text>
      <Text style={styles.text}>Status: {item.status?.replace('_', ' ')}</Text>
      <Text style={styles.text}>Age and level eligibility: {item.ageEligible && item.levelEligible ? 'eligible' : 'not eligible'}</Text>
      <Text style={styles.text}>Government ID image: {item.hasIdDocument ? 'uploaded' : item.documentUploadedAt ? 'submitted and removed after review' : 'not uploaded'}</Text>
      {item.hasIdDocument && <Button title={documents[item.userId] ? 'Hide ID image' : 'View ID image'} variant="outline" onPress={() => documents[item.userId] ? setDocuments((current) => { const next = { ...current }; delete next[item.userId]; return next; }) : viewDocument(item.userId)} disabled={viewing === item.userId} loading={viewing === item.userId} style={styles.viewButton} />}
      {documents[item.userId] && <Image source={{ uri: documents[item.userId] }} style={styles.document} resizeMode="contain" />}
      {item.status === 'pending' && <View style={styles.actions}>
        <Button title="Approve" onPress={() => review(item.userId, 'verified')} disabled={!item.ageEligible || !item.levelEligible || !item.hasIdDocument || !!busy} loading={busy === item.userId} style={styles.action} />
        <Button title="Reject" variant="outline" onPress={() => review(item.userId, 'rejected')} disabled={!!busy} style={styles.action} />
      </View>}
    </Card>)}
  </Screen>;
}

const styles = StyleSheet.create({
  instructions: { ...FONTS.small, lineHeight: 21, marginBottom: SPACING.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  name: { ...FONTS.h4 },
  text: { ...FONTS.small, marginTop: 5 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.base },
  action: { flex: 1 },
  viewButton: { marginTop: SPACING.sm },
  document: { width: '100%', height: 280, marginTop: SPACING.sm, backgroundColor: '#f2f4f7', borderRadius: 10 },
});
