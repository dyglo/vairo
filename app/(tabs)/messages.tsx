import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Search as SearchIcon } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { formatTimeAgo } from '@/utils/feedAlgorithm';

interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  userId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { getUser, markMessagesAsRead } = useApp();
  const [searchText, setSearchText] = useState('');
  const [conversations] = useState<Conversation[]>([
    {
      userId: '1',
      lastMessage: 'Hey, how are you?',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 2,
    },
  ]);

  const filteredConversations = conversations.filter(conv => {
    const user = getUser(conv.userId);
    return user?.name.toLowerCase().includes(searchText.toLowerCase());
  });

  const handleConversationPress = (userId: string) => {
    markMessagesAsRead(userId);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchIcon size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#ccc"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.conversationsList}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conversation => {
            const user = getUser(conversation.userId);
            if (!user) return null;

            return (
              <TouchableOpacity
                key={conversation.userId}
                style={styles.conversationItem}
                onPress={() => handleConversationPress(conversation.userId)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  {conversation.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.conversationInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.timeText}>{formatTimeAgo(conversation.lastMessageTime)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.lastMessage,
                      conversation.unreadCount > 0 && styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1a1a1a',
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
  },
  unreadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  conversationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 13,
    color: '#888',
  },
  unreadMessage: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
