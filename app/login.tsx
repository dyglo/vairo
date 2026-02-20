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
import { Mail, Lock, Eye, Circle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // Login successful - navigate to home
      router.push('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Please provide the details below to log in</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputWrap}>
          <Mail size={16} color="#8A8A8A" />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9E9E9E"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrap}>
          <Lock size={16} color="#8A8A8A" />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#9E9E9E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <Eye size={16} color="#8A8A8A" />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.rememberRow}>
            <Circle size={14} color="#8A8A8A" />
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Forget Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text style={styles.primaryButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or Continue With</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.oauthRow}>
          <TouchableOpacity style={styles.oauthButton}>
            <Text style={styles.oauthButtonText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.oauthButton}>
            <Text style={styles.oauthButtonText}>Apple</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.bottomLink}>
            Don&apos;t have an account? <Text style={styles.bottomLinkAccent}>Sign up</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.guestLink}>Continue as guest</Text>
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
    marginBottom: 18,
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
    minHeight: 50,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1A1A1A',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    color: '#6B6B6B',
    fontSize: 12,
  },
  forgotText: {
    color: '#D89B17',
    fontSize: 12,
    fontWeight: '600',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4E4E4',
  },
  dividerText: {
    color: '#7A7A7A',
    fontSize: 12,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: 10,
  },
  oauthButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  oauthButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
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
  guestLink: {
    marginTop: 10,
    color: '#6B6B6B',
    textAlign: 'center',
    fontSize: 13,
  },
});
