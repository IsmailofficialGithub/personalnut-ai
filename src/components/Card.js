import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/Theme';

export const Card = ({ 
  children, 
  style, 
  onPress, 
  elevated = true, 
  variant = 'default',
  padding = 'md' // 'none', 'sm', 'md', 'lg'
}) => {
  const { colors, isDark } = useTheme();

  // Use surface variants based on variant prop
  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.surfaceContainerLowest;
      case 'filled':
        return colors.surfaceContainer;
      case 'outlined':
        return colors.surfaceContainerLow;
      default:
        return colors.card;
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return Theme.spacing.sm;
      case 'md':
        return Theme.spacing.md;
      case 'lg':
        return Theme.spacing.lg;
      default:
        return Theme.spacing.md;
    }
  };

  const getBorderWidth = () => {
    if (variant === 'outlined') return 1.5;
    if (elevated) return 0; // No border when elevated (shadow provides separation)
    return 1;
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: colors.border,
      borderWidth: getBorderWidth(),
      padding: getPadding(),
      ...(elevated && Theme.getShadows(isDark).md), // Use theme-aware shadows
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={cardStyle}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.borderRadius.lg, // 12px - elegant rounded corners
  },
});