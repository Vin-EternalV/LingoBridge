import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { forgotPassword } from '../../api/auth';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            
            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.instruction}>
                  We've sent a password reset link to {email}.
                </Text>
                <Button 
                  title="Back to Log In" 
                  onPress={() => navigation.navigate('Login')} 
                  fullWidth 
                  style={styles.button}
                />
              </View>
            ) : (
              <>
                <Text style={styles.instruction}>
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </Text>
                
                <ErrorMessage message={error} />
                
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  icon="mail-outline"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Button 
                  title="Send Reset Code" 
                  onPress={handleReset} 
                  fullWidth 
                  loading={loading}
                  style={styles.button}
                />
              </>
            )}

            {!success && (
              <Button 
                title="Back to Log In" 
                variant="text" 
                onPress={() => navigation.navigate('Login')} 
                fullWidth 
              />
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    padding: SPACING.xl,
    flex: 1,
  },
  instruction: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  button: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  successTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
});

export default ForgotPasswordScreen;
