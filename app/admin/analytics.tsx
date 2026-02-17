import { View, Text, StyleSheet } from 'react-native';
import { AdminRoute } from '@/components/ProtectedRoute';

function AnalyticsContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.description}>View system analytics and metrics</Text>
    </View>
  );
}

export default function Analytics() {
  return (
    <AdminRoute>
      <AnalyticsContent />
    </AdminRoute>
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
