import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { FoodAnalysisScreen } from '../screens/FoodAnalysisScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';

const APP_LOGO = require('../../assets/app-logo.jpg');

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { user, profile, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Image 
          source={APP_LOGO} 
          style={styles.loadingLogo} 
          resizeMode="contain" 
        />
        <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
      </View>
    );
  }

  const needsOnboarding = user && profile && !profile.age;

  return (
    <NavigationContainer
      theme={{
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="Camera"
              component={CameraScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="FoodAnalysis"
              component={FoodAnalysisScreen}
              options={{ headerShown: true, title: 'Food Analysis' }}
            />
            <Stack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ headerShown: true, title: 'Subscription' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  loadingSpinner: {
    marginTop: 20,
  },
});