import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { RevenueCatProvider } from './src/contexts/RevenueCatContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  try {
    return (
      <ThemeProvider>
        <AuthProvider>
          <RevenueCatProvider>
            <NotificationProvider>
              <AppNavigator />
            </NotificationProvider>
          </RevenueCatProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>App Error</Text>
        <Text style={styles.errorDetails}>{error.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f00',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
  },
});
