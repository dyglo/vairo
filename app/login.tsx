/**
 * Login Screen - Instagram-style UI
 * 
 * Modern login interface with email and password authentication
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      router.push('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/');
  };

  const isFormValid = email.length > 0 && password.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.logo}>Vairo</Text>
          <Text style={styles.tagline}>Share Your Stories</Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or username"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#999" />
                ) : (
                  <Eye size={20} color="#999" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!isFormValid || loading) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Continue as Guest */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.5,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4D4D',
  },
  error: {
    color: '#FF4D4D',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  forgotContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  forgotText: {
    color: '#0095F6',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#0095F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#B3D9FF',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  guestButton: {
    borderWidth: 1.5,
    borderColor: '#0095F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestButtonText: {
    color: '#0095F6',
    fontSize: 16,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '700',
  },
});
