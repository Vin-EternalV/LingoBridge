import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import Header from './Header';
import { COLORS, SPACING } from '../constants/theme';

// Standard layout for the profile sub-screens: back-button header + scrollable body.
const Screen = ({ title, children }) => (
  <SafeAreaView style={styles.safeArea}>
    <Header title={title} showBack />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
});

export default Screen;
