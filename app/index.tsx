import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Share2, MessageCircle, Zap } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Auto-redirect to login after 2 seconds
    // Uncomment if you want auto-redirect:
    // const timer = setTimeout(() => router.push('/login'), 3000);
    // return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.mainLogo}>Vairo</Text>
            <Text style={styles.logoSubtitle}>Share Your Stories</Text>
          </View>

          {/* Feature Cards */}
          <View style={styles.featuresContainer}>
            {/* Feature 1 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Heart size={32} color="#FF4D4D" strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Share Moments</Text>
              <Text style={styles.featureDesc}>Post photos, videos, and stories that matter</Text>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MessageCircle size={32} color="#0095F6" strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Connect</Text>
              <Text style={styles.featureDesc}>Comment, react, and engage with your friends</Text>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Zap size={32} color="#FFD400" strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Discover</Text>
              <Text style={styles.featureDesc}>Explore trending content from around the world</Text>
            </View>

            {/* Feature 4 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Share2 size={32} color="#50C878" strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Share & Grow</Text>
              <Text style={styles.featureDesc}>Reach more people and build your community</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to start?</Text>
          <Text style={styles.ctaDesc}>Join thousands of creators sharing their moments</Text>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signupBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.signupBtnText}>Create Account</Text>
          </TouchableOpacity>

          {/* Guest Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={styles.guestLink}
          >
            <Text style={styles.guestLinkText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Vairo. All rights reserved.</Text>
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
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  mainLogo: {
    fontSize: 56,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 2,
    marginBottom: 8,
  },
  logoSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#0095F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signupBtn: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#0095F6',
  },
  signupBtnText: {
    color: '#0095F6',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guestLink: {
    paddingVertical: 12,
  },
  guestLinkText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});
