import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useTheme } from '../contexts/ThemeContext';

export const SubscriptionStatus = ({ onPress }) => {
  const { colors } = useTheme();
  const { isPro, subscriptionStatus, loading } = useRevenueCat();

  if (loading) {
    return null;
  }

  if (!isPro) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.card }]}
        onPress={onPress}
      >
        <View style={styles.content}>
          <Ionicons name="star" size={24} color={colors.primary} />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Upgrade to Pro</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Unlock all premium features
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, styles.activeContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Software Developer Pro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subscriptionStatus?.isLifetime
              ? 'Lifetime access'
              : subscriptionStatus?.expirationDate
              ? `Expires ${new Date(subscriptionStatus.expirationDate).toLocaleDateString()}`
              : 'Active'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  activeContainer: {
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
});
