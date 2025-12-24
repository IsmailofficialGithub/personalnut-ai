import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Theme, FontFamily } from '../constants/Theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  icon,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
          },
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: colors.text,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.iconContainer}
          >
            <Ionicons
              name={isSecure ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.fontSize.md, // 14pt for labels (14-16pt range)
    lineHeight: Theme.lineHeight.md, // 1.43× line height
    fontWeight: Theme.fontWeight.medium,
    fontFamily: FontFamily.medium,
    marginBottom: Theme.spacing.xs,
    allowFontScaling: true,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5, // Slightly thicker for better visibility
    borderRadius: Theme.borderRadius.lg, // 12px - consistent with buttons and cards
    paddingHorizontal: Theme.spacing.md,
    minHeight: 48, // Proper touch target size
  },
  iconContainer: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Theme.fontSize.base, // 16pt for input text
    lineHeight: Theme.lineHeight.base, // 1.5× line height
    fontWeight: Theme.fontWeight.regular,
    fontFamily: FontFamily.regular,
    paddingVertical: Theme.spacing.md,
    allowFontScaling: true,
  },
  error: {
    fontSize: Theme.fontSize.sm,
    lineHeight: Theme.lineHeight.sm,
    fontWeight: Theme.fontWeight.regular,
    fontFamily: FontFamily.regular,
    marginTop: Theme.spacing.xs,
    allowFontScaling: true,
  },
});