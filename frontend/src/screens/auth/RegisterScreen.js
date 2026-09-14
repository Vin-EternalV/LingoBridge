import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register(firstName, lastName, email, password);
      // Navigation handled by auth state changes
    } catch (err) {
      setError('Registration failed. Please try again.');
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
            
            <ErrorMessage message={error} />
            
            <View style={styles.nameContainer}>
              <View style={styles.halfWidth}>
                <Input
                  label="First Name"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
            
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              secureTextEntry
            />
            <Text style={styles.hint}>Password must be at least 6 characters long.</Text>
            
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon="lock-closed-outline"
              secureTextEntry
            />

            <Button 
              title="Create Account" 
              onPress={handleRegister} 
              fullWidth 
              loading={loading}
              style={styles.registerButton}
            />
            
            <Button 
              title="Already have an account? Log In" 
              variant="text" 
              onPress={() => navigation.navigate('Login')} 
              fullWidth 
            />

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
    paddingBottom: SPACING.xxl,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  hint: {
    ...FONTS.tiny,
    color: COLORS.textSecondary,
    marginBottom: SPACING.base,
    marginTop: -SPACING.sm,
  },
  registerButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
});

export default RegisterScreen;
