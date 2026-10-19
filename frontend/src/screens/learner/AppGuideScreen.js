import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { GUIDE_STEPS } from '../../constants/guide';
import { markGuideSeen } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

// A short walkthrough. It opens by itself once for a new learner (firstRun), and any time from Profile.
const AppGuideScreen = ({ route, navigation }) => {
  const firstRun = !!route.params?.firstRun;
  const { updateUser, user } = useAuth();
  const birthDate = user?.dateOfBirth ? new Date(user.dateOfBirth) : null;
  const now = new Date();
  const age = birthDate ? now.getFullYear() - birthDate.getFullYear() - (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate()) ? 1 : 0) : null;
  const steps = age !== null && age >= 18 ? GUIDE_STEPS : GUIDE_STEPS.filter((item) => !item.ieltsOnly);
  const [step, setStep] = useState(0);

  // Mark it as seen right away, so it never comes back on its own even if the learner skips it.
  useEffect(() => {
    if (!firstRun) return;
    updateUser({ guideSeenAt: new Date().toISOString() });
    markGuideSeen().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const close = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.top}>
        <Text style={styles.counter}>
          Step {step + 1} of {steps.length}
        </Text>
        {!isLast && (
          <TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel="Skip the guide" style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: `${current.color}20` }]}>
          <Ionicons name={current.icon} size={44} color={current.color} />
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.text}</Text>
        {current.tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.buttons}>
          {step > 0 && <Button title="Back" variant="outline" onPress={() => setStep((s) => s - 1)} style={styles.button} />}
          <Button
            title={isLast ? (firstRun ? 'Get started' : 'Done') : 'Next'}
            onPress={() => (isLast ? close() : setStep((s) => s + 1))}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent', ...Platform.select({ web: { alignItems: 'center' } }) },
  top: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingTop: SPACING.base },
  counter: { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  skip: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md },
  skipText: { ...FONTS.regular, color: COLORS.primary, fontWeight: '600' },
  body: { alignItems: 'center', padding: SPACING.xl, paddingBottom: SPACING.base, width: '100%', maxWidth: 520 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, marginBottom: SPACING.lg },
  title: { ...FONTS.h2, textAlign: 'center', marginBottom: SPACING.md },
  text: { ...FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.lg },
  tipRow: { flexDirection: 'row', gap: SPACING.sm, alignSelf: 'stretch', marginBottom: SPACING.sm, paddingHorizontal: SPACING.sm },
  tipText: { ...FONTS.small, color: COLORS.text, lineHeight: 20, flex: 1 },
  footer: { width: '100%', maxWidth: 520, padding: SPACING.base, paddingBottom: SPACING.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.base },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 22, backgroundColor: COLORS.primary },
  buttons: { flexDirection: 'row', gap: SPACING.sm },
  button: { flex: 1 },
});

export default AppGuideScreen;
