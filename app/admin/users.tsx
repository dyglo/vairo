import { View, Text, StyleSheet } from 'react-native';
import { AdminRoute } from '@/components/ProtectedRoute';

function UserManagementContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      <Text style={styles.description}>Manage application users and their roles</Text>
    </View>
  );
}

export default function UserManagement() {
  return (
    <AdminRoute>
      <UserManagementContent />
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
