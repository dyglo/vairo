import { View, Text, StyleSheet } from 'react-native';
import { ModeratorRoute } from '@/components/ProtectedRoute';

function ReportsContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reported Content</Text>
      <Text style={styles.description}>Review user reports and take action</Text>
    </View>
  );
}

export default function Reports() {
  return (
    <ModeratorRoute>
      <ReportsContent />
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
