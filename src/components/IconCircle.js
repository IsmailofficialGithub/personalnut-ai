import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/Theme';

export const IconCircle = ({ 
  children, 
  size = 52, 
  color, 
  style,
  variant = 'default' // 'default', 'subtle', 'accent'
}) => {
  const { colors, isDark } = useTheme();

  const getBackgroundColor = () => {
    if (color) {
      // Use proper opacity based on theme
      const opacity = isDark ? 0.2 : 0.1;
      return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
    }
    
    switch (variant) {
      case 'subtle':
        return colors.surfaceContainer;
      case 'accent':
        return colors.surfaceContainerHigh;
      default:
        return colors.surfaceContainer;
    }
  };

  return (
    <View
      style={[
        styles.iconCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

