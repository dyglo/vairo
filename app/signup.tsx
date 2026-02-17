/**
 * Sign Up Screen - Instagram-style registration
 * 
 * Modern sign-up interface for creating new accounts
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSignUp = async () => {
    // Validation
    if (!name || !email || !username || !password || !confirmPassword) {
      setError('All fields are required');
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

    try {
      setLoading(true);
      setError('');
      
      // TODO: Call signup API
      // await signup({ name, email, username, phone, password });
      
      // For now, simulate signup success
      setTimeout(() => {
        router.push('/login');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.length > 0 && email.length > 0 && username.length > 0 && password.length > 0 && confirmPassword.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Join Vairo Today</Text>
          <Text style={styles.subtitle}>Share your stories with the world</Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <User size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError('');
                }}
                editable={!loading}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
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

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <User size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text.toLowerCase().replace(/[^a-z0-9._]/g, ''));
                  setError('');
                }}
                editable={!loading}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Phone Input (Optional) */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone (optional)"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                keyboardType="phone-pad"
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

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError('');
                }}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#999" />
                ) : (
                  <Eye size={20} color="#999" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              (!isFormValid || loading) && styles.signupButtonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  titleSection: {
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    marginBottom: 30,
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
  signupButton: {
    backgroundColor: '#0095F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonDisabled: {
    backgroundColor: '#B3D9FF',
    shadowOpacity: 0.1,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 4,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '700',
  },
});
