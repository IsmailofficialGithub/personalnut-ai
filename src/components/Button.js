import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Theme, FontFamily } from '../constants/Theme';
import { Gradients } from '../constants/Colors';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: Theme.borderRadius.lg, // 12px - more elegant rounded corners
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Theme.spacing.xs, // Space between icon and text
      minHeight: size === 'small' ? 36 : size === 'medium' ? 48 : 56, // Proper aspect ratios
    };

    const sizeStyles = {
      small: { 
        paddingVertical: Theme.spacing.sm, // 8px
        paddingHorizontal: Theme.spacing.md, // 16px
        minHeight: 36,
      },
      medium: { 
        paddingVertical: Theme.spacing.md, // 16px
        paddingHorizontal: Theme.spacing.lg, // 24px
        minHeight: 48,
      },
      large: { 
        paddingVertical: Theme.spacing.lg, // 24px
        paddingHorizontal: Theme.spacing.xl, // 32px
        minHeight: 56,
      },
    };

    return { ...baseStyle, ...sizeStyles[size] };
  };

  const getTextStyle = () => {
    const baseStyle = {
      fontWeight: Theme.fontWeight.semibold, // Semibold for better visibility
      fontFamily: FontFamily.semibold,
      textAlign: 'center',
      allowFontScaling: true,
      letterSpacing: 0.2, // Subtle letter spacing for elegance
    };

    const sizeStyles = {
      small: { 
        fontSize: Theme.fontSize.sm, // 12pt
        lineHeight: Theme.lineHeight.sm,
      },
      medium: { 
        fontSize: Theme.fontSize.base, // 16pt
        lineHeight: Theme.lineHeight.base,
      },
      large: { 
        fontSize: Theme.fontSize.lg, // 18pt
        lineHeight: Theme.lineHeight.lg,
      },
    };

    const colorStyles = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#FFFFFF' },
      outline: { color: colors.primary },
      text: { color: colors.primary },
      ghost: { color: colors.text },
    };

    return { ...baseStyle, ...sizeStyles[size], ...colorStyles[variant] };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : colors.primary} 
          size={size === 'small' ? 'small' : 'small'}
        />
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        {title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
      </View>
    );
  };

  // Primary button with gradient
  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.container, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[getButtonStyle(), styles.gradientButton]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Secondary button with solid color
  if (variant === 'secondary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          getButtonStyle(),
          {
            backgroundColor: colors.secondary,
            ...Theme.getShadows(isDark).sm,
          },
          style,
        ]}
        activeOpacity={0.85}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Outline button
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          getButtonStyle(),
          {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: disabled ? colors.border : colors.primary,
          },
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Ghost button (subtle background)
  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          getButtonStyle(),
          {
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.03)',
          },
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Text button
  const variantStyles = {
    text: {
      backgroundColor: 'transparent',
    },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getButtonStyle(),
        disabled ? styles.disabled : variantStyles[variant],
        style,
      ]}
      activeOpacity={0.6}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradientButton: {
    ...Theme.shadows.sm,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});