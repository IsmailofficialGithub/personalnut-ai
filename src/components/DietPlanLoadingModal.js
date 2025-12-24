import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../constants/Colors';

const loadingMessages = [
  'Understanding your goals...',
  'Crafting your perfect plan...',
  'Optimizing nutrition...',
  'Preparing meal suggestions...',
  'Almost there! ✨',
];

export const DietPlanLoadingModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [currentMessage, setCurrentMessage] = React.useState(0);

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotating animation for icon
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Cycle through messages
      const messageInterval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);

      return () => clearInterval(messageInterval);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      rotateAnim.setValue(0);
      setCurrentMessage(0);
    }
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
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
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: colors.card,
              },
            ]}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    transform: [{ rotate: spin }],
                  },
                ]}
              >
                <Ionicons name="restaurant" size={48} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>

            <Text style={[styles.title, { color: colors.text }]}>
              Creating Your Perfect Plan
            </Text>

            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {loadingMessages[currentMessage]}
            </Text>

            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>

            <View style={styles.tipsContainer}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                This usually takes 30-60 seconds
              </Text>
            </View>
          </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    maxWidth: 400,
    borderRadius: Theme.borderRadius.xl * 2,
    padding: Theme.spacing.xl * 1.5,
    alignItems: 'center',
    ...Theme.shadows.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.md,
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    minHeight: 24,
  },
  loaderContainer: {
    marginVertical: Theme.spacing.md,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.md,
  },
  tipText: {
    fontSize: Theme.fontSize.sm,
  },
});

