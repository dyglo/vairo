import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Type, Image as ImageIcon, Video, X } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';

type PostType = 'text' | 'image' | 'video';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createPost } = useApp();
  const [postType, setPostType] = useState<PostType | null>(null);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  const handleCreatePost = () => {
    if (!postType) {
      Alert.alert('Error', 'Please select a post type');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please enter a caption');
      return;
    }

    if ((postType === 'image' || postType === 'video') && !mediaUrl.trim()) {
      Alert.alert('Error', 'Please enter a media URL');
      return;
    }

    createPost(caption.trim(), postType, mediaUrl.trim() || undefined);

    setCaption('');
    setMediaUrl('');
    setPostType(null);

    Alert.alert('Success', 'Post created successfully!', [
      {
        text: 'OK',
        onPress: () => router.push('/(tabs)/'),
      },
    ]);
  };

  const handleCancel = () => {
    setCaption('');
    setMediaUrl('');
    setPostType(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        {postType && (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!postType ? (
          <View style={styles.typeSelection}>
            <Text style={styles.sectionTitle}>Choose Post Type</Text>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => setPostType('text')}
            >
              <View style={[styles.typeIcon, { backgroundColor: '#FFD400' }]}>
                <Type size={28} color="#1a1a1a" />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>Text Post</Text>
                <Text style={styles.typeDescription}>Share your thoughts with the world</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => setPostType('image')}
            >
              <View style={[styles.typeIcon, { backgroundColor: '#FF6B35' }]}>
                <ImageIcon size={28} color="#fff" />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>Image Post</Text>
                <Text style={styles.typeDescription}>Share a photo with caption</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => setPostType('video')}
            >
              <View style={[styles.typeIcon, { backgroundColor: '#4ECDC4' }]}>
                <Video size={28} color="#fff" />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>Video Post</Text>
                <Text style={styles.typeDescription}>Share a short video</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>
              {postType === 'text' && 'Text Post'}
              {postType === 'image' && 'Image Post'}
              {postType === 'video' && 'Video Post'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Caption / Message</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#888"
                value={caption}
                onChangeText={setCaption}
                multiline
                textAlignVertical="top"
              />
            </View>

            {(postType === 'image' || postType === 'video') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {postType === 'image' ? 'Image URL' : 'Video URL'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${postType} URL from Pexels or similar`}
                  placeholderTextColor="#888"
                  value={mediaUrl}
                  onChangeText={setMediaUrl}
                />
                <Text style={styles.helperText}>
                  For demo: Use any image URL like https://images.pexels.com/...
                </Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postButton} onPress={handleCreatePost}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.tagline}>Everyone deserves to be heard.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cancelBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  typeSelection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
  },
  createForm: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 120,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1a1a1a',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  postButton: {
    flex: 1,
    backgroundColor: '#FFD400',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tagline: {
    color: '#FFD400',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
