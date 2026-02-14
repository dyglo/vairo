import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Grid3x3, Bookmark, PlaySquare } from 'lucide-react-native';

interface ProfileTabsProps {
  activeTab: 'posts' | 'saved' | 'videos';
  onTabChange: (tab: 'posts' | 'saved' | 'videos') => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
        onPress={() => onTabChange('posts')}
      >
        <Grid3x3
          size={22}
          color={activeTab === 'posts' ? '#1a1a1a' : '#999'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
        onPress={() => onTabChange('videos')}
      >
        <PlaySquare
          size={22}
          color={activeTab === 'videos' ? '#1a1a1a' : '#999'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
        onPress={() => onTabChange('saved')}
      >
        <Bookmark
          size={22}
          color={activeTab === 'saved' ? '#1a1a1a' : '#999'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1a1a1a',
  },
});
