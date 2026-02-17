import { View, Text, StyleSheet } from 'react-native';
import { ModeratorRoute } from '@/components/ProtectedRoute';

function LogsContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moderation Logs</Text>
      <Text style={styles.description}>View moderation action history</Text>
    </View>
  );
}

export default function Logs() {
  return (
    <ModeratorRoute>
      <LogsContent />
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
