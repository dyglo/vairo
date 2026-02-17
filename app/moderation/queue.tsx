import { View, Text, StyleSheet } from 'react-native';
import { ModeratorRoute } from '@/components/ProtectedRoute';

function QueueContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Queue</Text>
      <Text style={styles.description}>Content pending moderation review</Text>
    </View>
  );
}

export default function Queue() {
  return (
    <ModeratorRoute>
      <QueueContent />
    </ModeratorRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
});
