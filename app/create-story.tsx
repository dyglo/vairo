import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Camera, Image as ImageIcon } from 'lucide-react-native';

export default function CreateStoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Story</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.optionBtn}>
          <View style={styles.optionIcon}>
            <Camera size={32} color="#FFD400" />
          </View>
          <Text style={styles.optionText}>Take Photo</Text>
          <Text style={styles.optionSubtext}>Capture a moment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionBtn}>
          <View style={styles.optionIcon}>
            <ImageIcon size={32} color="#FFD400" />
          </View>
          <Text style={styles.optionText}>Choose from Gallery</Text>
          <Text style={styles.optionSubtext}>Select existing photo</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.tagline}>Everyone deserves to be heard.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  optionBtn: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  optionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,212,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtext: {
    color: '#888',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tagline: {
    color: '#FFD400',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
