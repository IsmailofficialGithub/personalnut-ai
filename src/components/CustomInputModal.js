import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { Theme } from '../constants/Theme';

export const CustomInputModal = ({ visible, onClose, onAdd, title, placeholder, type = 'allergy' }) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      setInputValue('');
    }
  }, [visible]);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed.length > 0) {
      onAdd(trimmed);
      setInputValue('');
      onClose();
    }
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.card,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons
                      name={type === 'allergy' ? 'warning' : 'medical'}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Enter {type === 'allergy' ? 'allergy' : 'condition'} name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                  maxLength={50}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  {inputValue.length}/50 characters
                </Text>
              </View>

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleClose}
                  style={styles.footerButton}
                />
                <Button
                  title="Add"
                  onPress={handleAdd}
                  style={[styles.footerButton, { flex: 1 }]}
                  disabled={!inputValue.trim()}
                />
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: Theme.borderRadius.xl * 2,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
    marginBottom: Theme.spacing.xs,
  },
  hint: {
    fontSize: Theme.fontSize.xs,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: Theme.spacing.lg,
    gap: Theme.spacing.sm,
    borderTopWidth: 1,
  },
  footerButton: {
    minWidth: 100,
  },
});

