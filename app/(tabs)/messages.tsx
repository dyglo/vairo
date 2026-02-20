import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();

  // Placeholder messages data
  const [messages] = React.useState<Message[]>([]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.headerTitle}>Messages</Text>
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageItem}>
      <View style={styles.messageContent}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={[styles.emptyContainer, { paddingTop: insets.top + 50 }]}>
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  listContent: {
    paddingHorizontal: 0,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
  },
  timestamp: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
});
