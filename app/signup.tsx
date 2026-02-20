import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { User, Mail, Phone, Lock, Eye, ChevronDown, Circle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('✓ Mock Registration successful');
      router.replace('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>Vairo</Text>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Please provide the details below to create your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputWrap}>
          <User size={16} color="#8A8A8A" />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9E9E9E"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputWrap}>
          <Mail size={16} color="#8A8A8A" />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9E9E9E"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrap}>
          <Phone size={16} color="#8A8A8A" />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#9E9E9E"
            value={phone}
            editable={false}
          />
        </View>

        <View style={styles.inputWrap}>
          <Lock size={16} color="#8A8A8A" />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#9E9E9E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <Eye size={16} color="#8A8A8A" />
        </View>

        <View style={styles.inputWrap}>
          <Lock size={16} color="#8A8A8A" />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#9E9E9E"
            value={confirmPassword}
            editable={false}
            secureTextEntry
          />
          <Eye size={16} color="#8A8A8A" />
        </View>

        <View style={styles.termsRow}>
          <Circle size={14} color="#8A8A8A" />
          <Text style={styles.termsText}>
            I agree with the <Text style={styles.termsAccent}>Terms and Conditions</Text> and
            <Text style={styles.termsAccent}> Privacy Policy</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.bottomLink}>
            Have an account? <Text style={styles.bottomLinkAccent}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D89B17',
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#121212',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B6B6B',
    marginTop: 8,
    marginBottom: 16,
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 12,
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 12,
    marginBottom: 10,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
    marginBottom: 14,
  },
  termsText: {
    flex: 1,
    color: '#6B6B6B',
    fontSize: 12,
    lineHeight: 17,
  },
  termsAccent: {
    color: '#D89B17',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#FFBD2E',
    borderRadius: 12,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#B00020',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 12,
  },
  bottomLink: {
    color: '#5C5C5C',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 14,
  },
  bottomLinkAccent: {
    color: '#D89B17',
    fontWeight: '600',
  },
});
