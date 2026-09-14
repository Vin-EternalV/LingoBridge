import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../constants/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      // Navigation is handled by AppNavigator listening to auth state changes
    } catch (err) {
      setError('Invalid email or password. Please try again.');
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              secureTextEntry
            />
            
            <View style={styles.forgotPasswordContainer}>
              <Button 
                title="Forgot Password?" 
                variant="text" 
                onPress={() => navigation.navigate('ForgotPassword')} 
              />
            </View>

            <Button 
              title="Log In" 
              onPress={handleLogin} 
              fullWidth 
              loading={loading}
              style={styles.loginButton}
            />
            
            <Button 
              title="Don't have an account? Sign Up" 
              variant="text" 
              onPress={() => navigation.navigate('Register')} 
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
    flex: 1,
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
  },
  loginButton: {
    marginBottom: SPACING.lg,
  },
});

export default LoginScreen;
