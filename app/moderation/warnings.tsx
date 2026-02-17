import { View, Text, StyleSheet } from 'react-native';
import { ModeratorRoute } from '@/components/ProtectedRoute';

function WarningsContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Warnings</Text>
      <Text style={styles.description}>Manage user warnings and enforcement</Text>
    </View>
  );
}

export default function Warnings() {
  return (
    <ModeratorRoute>
      <WarningsContent />
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
