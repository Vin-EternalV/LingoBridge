import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.appName}>LingoBridge</Text>
          <Text style={styles.tagline}>Your AI-Powered English Learning Companion</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Ionicons name="chatbubbles" size={120} color={COLORS.primaryLight} />
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="sparkles" size={24} color={COLORS.primary} style={styles.featureIcon} />
            <Text style={styles.featureText}>Personalized AI tutoring</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="stats-chart" size={24} color={COLORS.primary} style={styles.featureIcon} />
            <Text style={styles.featureText}>Track your progress</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="book" size={24} color={COLORS.primary} style={styles.featureIcon} />
            <Text style={styles.featureText}>Interactive practice</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Get Started" 
            onPress={() => navigation.navigate('Register')} 
            fullWidth 
            style={styles.mainButton}
          />
          <Button 
            title="I already have an account" 
            variant="text" 
            onPress={() => navigation.navigate('Login')} 
            fullWidth 
          />
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  appName: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  tagline: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  featuresContainer: {
    marginBottom: SPACING.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: 12,
  },
  featureIcon: {
    marginRight: SPACING.base,
  },
  featureText: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  footer: {
    paddingBottom: SPACING.base,
  },
  mainButton: {
    marginBottom: SPACING.sm,
  },
});

export default WelcomeScreen;
