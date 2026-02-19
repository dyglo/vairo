import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignupScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth(); // Using login for mock auth
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleSignup = async () => {
        if (!username || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError('');
            // MOCK SIGNUP: Just log them in as the requested user
            await login(email, password);
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#ffffff', '#f8f9ff', '#f0f2ff']}
            style={styles.container}
        >
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => router.back()}
            >
                <ChevronLeft size={24} color="#0f172a" />
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.brandName}>Vairo</Text>
                        <Text style={styles.title}>Create account</Text>
                        <Text style={styles.subtitle}>Join our community and start sharing your stories</Text>
                    </View>

                    <View style={styles.form}>
                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.inputWrapper}>
                            <User size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor="#94a3b8"
                                value={username}
                                onChangeText={setUsername}
                                editable={!loading}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Mail size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                placeholderTextColor="#94a3b8"
                                value={email}
                                onChangeText={setEmail}
                                editable={!loading}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <Text style={styles.termsText}>
                            By signing up, you agree to our{' '}
                            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>

                        <TouchableOpacity
                            style={[styles.signupButton, loading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.signupButtonText}>Create Account</Text>
                                    <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/login' as any)}>
                            <Text style={styles.loginLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    brandName: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 8,
        lineHeight: 24,
    },
    form: {
        gap: 16,
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
        fontWeight: '500',
    },
    termsText: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
        marginVertical: 8,
    },
    termsLink: {
        color: '#1a1a1a',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    signupButton: {
        backgroundColor: '#FFD400',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    signupButtonText: {
        color: '#1a1a1a',
        fontSize: 17,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 15,
        color: '#64748b',
    },
    loginLink: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a1a',
        textDecorationLine: 'underline',
    },
});
