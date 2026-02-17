import { View, Text, StyleSheet } from 'react-native';
import { AdminRoute } from '@/components/ProtectedRoute';

function SettingsContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Settings</Text>
      <Text style={styles.description}>Configure system-wide settings</Text>
    </View>
  );
}

export default function Settings() {
  return (
    <AdminRoute>
      <SettingsContent />
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
