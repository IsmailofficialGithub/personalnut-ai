import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { Button } from './Button';
import { CustomInputModal } from './CustomInputModal';
import { Theme } from '../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRIMARY_GREEN = '#4ADE80';

const BudgetOptions = [
  { value: 'low', label: 'Low Budget', icon: 'wallet-outline', description: 'Affordable ingredients' },
  { value: 'medium', label: 'Medium Budget', icon: 'cash-outline', description: 'Balanced cost' },
  { value: 'high', label: 'High Budget', icon: 'diamond-outline', description: 'Premium ingredients' },
  { value: 'flexible', label: 'Flexible', icon: 'options-outline', description: 'Any budget' },
];

const DurationOptions = [
  { value: 3, label: '3 Days', icon: 'calendar-outline' },
  { value: 7, label: '1 Week', icon: 'calendar-outline' },
  { value: 14, label: '14 Days', icon: 'calendar-outline' },
  { value: 30, label: '30 Days', icon: 'calendar-outline' },
  { value: 45, label: '45 Days', icon: 'calendar-outline' },
];

const GoalOptions = [
  { value: 'weight_loss', label: 'Weight Loss', icon: 'trending-down-outline' },
  { value: 'weight_gain', label: 'Weight Gain', icon: 'trending-up-outline' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: 'barbell-outline' },
  { value: 'healthy_eating', label: 'Healthy Eating', icon: 'heart-outline' },
  { value: 'maintenance', label: 'Maintenance', icon: 'balance-outline' },
  { value: 'athletic_performance', label: 'Athletic Performance', icon: 'fitness-outline' },
];

const MealFrequencyOptions = [
  { value: 3, label: '3 Meals', description: 'Breakfast, Lunch, Dinner', icon: 'restaurant-outline' },
  { value: 4, label: '4 Meals', description: 'Breakfast, Lunch, Dinner, Snack', icon: 'fast-food-outline' },
  { value: 5, label: '5 Meals', description: '3 Meals + 2 Snacks', icon: 'nutrition-outline' },
  { value: 6, label: '6 Meals', description: '3 Meals + 3 Snacks', icon: 'cafe-outline' },
];

const AllergyOptions = [
  { value: 'nuts', label: 'Nuts', icon: 'warning-outline' },
  { value: 'dairy', label: 'Dairy', icon: 'warning-outline' },
  { value: 'gluten', label: 'Gluten', icon: 'warning-outline' },
  { value: 'soy', label: 'Soy', icon: 'warning-outline' },
  { value: 'eggs', label: 'Eggs', icon: 'warning-outline' },
  { value: 'shellfish', label: 'Shellfish', icon: 'warning-outline' },
  { value: 'fish', label: 'Fish', icon: 'warning-outline' },
  { value: 'none', label: 'None', icon: 'checkmark-circle-outline' },
];

const HealthConditionOptions = [
  { value: 'diabetes', label: 'Diabetes', icon: 'medical-outline' },
  { value: 'hypertension', label: 'Hypertension', icon: 'medical-outline' },
  { value: 'heart_disease', label: 'Heart Disease', icon: 'medical-outline' },
  { value: 'high_cholesterol', label: 'High Cholesterol', icon: 'medical-outline' },
  { value: 'pcos', label: 'PCOS', icon: 'medical-outline' },
  { value: 'thyroid', label: 'Thyroid Issues', icon: 'medical-outline' },
  { value: 'none', label: 'None', icon: 'checkmark-circle-outline' },
];

const TOTAL_STEPS = 7;

// Calculate card width for 2-column grid with 8px base spacing
const CARD_GAP = 12;
const CARD_PADDING = 20;
const GOAL_CARD_WIDTH = (SCREEN_WIDTH - (CARD_PADDING * 2) - (CARD_GAP * 2) - (Theme.spacing.xl * 2)) / 2;
const GOAL_CARD_HEIGHT = 160;

// Duration card dimensions
const DURATION_CARD_WIDTH = 100;
const DURATION_CARD_HEIGHT = 120;
const DURATION_GAP = 10;

export const DietPlanOptionsModal = ({ visible, onClose, onSubmit, profile }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState('flexible');
  const [duration, setDuration] = useState(7);

  // Reset duration if user doesn't have access to premium plans
  useEffect(() => {
    const isPremiumUser = user?.email === 'awaisnsolbpo@gmail.com';
    if ((duration === 30 || duration === 45) && !isPremiumUser) {
      setDuration(7); // Reset to default 7 days
    }
  }, [user?.email, duration]);
  const [goals, setGoals] = useState(['healthy_eating']);
  const [mealFrequency, setMealFrequency] = useState(3);
  const [allergies, setAllergies] = useState(profile?.allergies || []);
  const [healthConditions, setHealthConditions] = useState(profile?.health_conditions || []);
  const [customAllergies, setCustomAllergies] = useState([]);
  const [customHealthConditions, setCustomHealthConditions] = useState([]);
  const [customQuestions, setCustomQuestions] = useState('');
  const [showCustomAllergyModal, setShowCustomAllergyModal] = useState(false);
  const [showCustomConditionModal, setShowCustomConditionModal] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnimRefs = useRef({}).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  useEffect(() => {
    const progress = (step / TOTAL_STEPS) * 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const animateCardPress = (cardId, callback) => {
    if (!scaleAnimRefs[cardId]) {
      scaleAnimRefs[cardId] = new Animated.Value(1);
    }
    
    Animated.sequence([
      Animated.spring(scaleAnimRefs[cardId], {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(scaleAnimRefs[cardId], {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
    
    if (callback) {
      setTimeout(callback, 100);
    }
  };

  const toggleGoal = (goalValue) => {
    animateCardPress(`goal_${goalValue}`, () => {
      setGoals(prev => {
        if (prev.includes(goalValue)) {
          return prev.filter(g => g !== goalValue);
        } else {
          return [...prev, goalValue];
        }
      });
    });
  };

  const toggleAllergy = (allergyValue) => {
    if (allergyValue.startsWith('custom_')) {
      const customValue = allergyValue.replace('custom_', '');
      setCustomAllergies(prev => {
        if (prev.includes(customValue)) {
          return prev.filter(a => a !== customValue);
        } else {
          return [...prev, customValue];
        }
      });
    } else {
      setAllergies(prev => {
        if (allergyValue === 'none') {
          return ['none'];
        }
        if (prev.includes(allergyValue)) {
          const filtered = prev.filter(a => a !== allergyValue && a !== 'none');
          return filtered.length === 0 ? ['none'] : filtered;
        } else {
          const filtered = prev.filter(a => a !== 'none');
          return [...filtered, allergyValue];
        }
      });
    }
  };

  const toggleHealthCondition = (conditionValue) => {
    if (conditionValue.startsWith('custom_')) {
      const customValue = conditionValue.replace('custom_', '');
      setCustomHealthConditions(prev => {
        if (prev.includes(customValue)) {
          return prev.filter(c => c !== customValue);
        } else {
          return [...prev, customValue];
        }
      });
    } else {
      setHealthConditions(prev => {
        if (conditionValue === 'none') {
          return ['none'];
        }
        if (prev.includes(conditionValue)) {
          const filtered = prev.filter(c => c !== conditionValue && c !== 'none');
          return filtered.length === 0 ? ['none'] : filtered;
        } else {
          const filtered = prev.filter(c => c !== 'none');
          return [...filtered, conditionValue];
        }
      });
    }
  };

  const addCustomAllergy = (allergy) => {
    setCustomAllergies(prev => [...prev, allergy]);
  };

  const addCustomCondition = (condition) => {
    setCustomHealthConditions(prev => [...prev, condition]);
  };

  const removeCustomAllergy = (allergy) => {
    setCustomAllergies(prev => prev.filter(a => a !== allergy));
  };

  const removeCustomCondition = (condition) => {
    setCustomHealthConditions(prev => prev.filter(c => c !== condition));
  };

  const validateStep = (stepNum) => {
    switch (stepNum) {
      case 1:
        if (goals.length === 0) {
          Alert.alert('Select Goals', 'Please select at least one goal for your diet plan.');
          return false;
        }
        return true;
      case 2:
        if (!mealFrequency || mealFrequency < 3 || mealFrequency > 6) {
          Alert.alert('Select Meal Frequency', 'Please select how many meals you prefer per day.');
          return false;
        }
        return true;
      case 3:
        if (!duration || duration < 3 || duration > 45) {
          Alert.alert('Select Duration', 'Please select a plan duration.');
          return false;
        }
        // Check if user is trying to select premium duration without access
        const isPremiumUser = user?.email === 'awaisnsolbpo@gmail.com';
        if ((duration === 30 || duration === 45) && !isPremiumUser) {
          Alert.alert(
            'Premium Feature',
            '30-day and 45-day diet plans are only available for premium users. Please select a shorter duration (3, 7, or 14 days).'
          );
          return false;
        }
        return true;
      case 4:
        return true;
      case 5:
      case 6:
      case 7:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }

    if (step < TOTAL_STEPS) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(step)) {
      return;
    }

    onSubmit({
      budget,
      duration,
      goals,
      mealFrequency,
      allergies: [...allergies.filter(a => a !== 'none'), ...customAllergies],
      healthConditions: [...healthConditions.filter(c => c !== 'none'), ...customHealthConditions],
      customQuestions: customQuestions.trim(),
    });
  };

  const handleClose = () => {
    setStep(1);
    setBudget('flexible');
    setDuration(7);
    setGoals(['healthy_eating']);
    setMealFrequency(3);
    setAllergies(profile?.allergies || []);
    setHealthConditions(profile?.health_conditions || []);
    setCustomAllergies([]);
    setCustomHealthConditions([]);
    setCustomQuestions('');
    onClose();
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'What are your goals?';
      case 2: return 'How many meals per day?';
      case 3: return 'Plan duration?';
      case 4: return 'Budget preference?';
      case 5: return 'Any allergies?';
      case 6: return 'Health conditions?';
      case 7: return 'Any special preferences?';
      default: return 'Plan Options';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Select one or more goals to personalize your meal plan';
      case 2: return 'Choose how many meals you prefer to eat each day';
      case 3: return 'How long would you like this meal plan?';
      case 4: return 'Select your budget range for meal ingredients';
      case 5: return 'Select any food allergies (optional)';
      case 6: return 'Select any health conditions (optional)';
      case 7: return 'Tell us anything specific (optional)';
      default: return '';
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: PRIMARY_GREEN,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step {step} of {TOTAL_STEPS}
        </Text>
      </View>
    );
  };

  // Step 1: Goals Grid (2 columns)
  const renderStep1 = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.goalsGrid}>
        {GoalOptions.map((option) => {
          const isSelected = goals.includes(option.value);
          const cardId = `goal_${option.value}`;
          if (!scaleAnimRefs[cardId]) {
            scaleAnimRefs[cardId] = new Animated.Value(1);
          }
          
          return (
            <Animated.View
              key={option.value}
              style={[
                {
                  transform: [{ scale: scaleAnimRefs[cardId] }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: isSelected ? `${PRIMARY_GREEN}15` : '#2a2a2a',
                    borderColor: isSelected ? PRIMARY_GREEN : '#3a3a3a',
                    borderWidth: isSelected ? 2 : 1,
                    shadowColor: isSelected ? PRIMARY_GREEN : '#000',
                    shadowOpacity: isSelected ? 0.2 : 0.1,
                    shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
                    shadowRadius: isSelected ? 16 : 8,
                    elevation: isSelected ? 8 : 4,
                  },
                ]}
                onPress={() => toggleGoal(option.value)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[
                  styles.goalIconContainer,
                  { backgroundColor: isSelected ? `${PRIMARY_GREEN}20` : '#1a1a1a' }
                ]}>
                  <Ionicons
                    name={option.icon}
                    size={32}
                    color={isSelected ? PRIMARY_GREEN : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.goalLabel,
                    {
                      color: isSelected ? PRIMARY_GREEN : colors.text,
                      fontWeight: isSelected ? Theme.fontWeight.bold : Theme.fontWeight.semibold,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={[styles.checkmarkBadge, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  // Step 2: Meal Frequency (Vertical list)
  const renderStep2 = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.mealFrequencyContainer}>
        {MealFrequencyOptions.map((option) => {
          const isSelected = mealFrequency === option.value;
          const cardId = `meal_${option.value}`;
          if (!scaleAnimRefs[cardId]) {
            scaleAnimRefs[cardId] = new Animated.Value(1);
          }
          
          return (
            <Animated.View
              key={option.value}
              style={[
                {
                  transform: [{ scale: scaleAnimRefs[cardId] }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.mealFrequencyCard,
                  {
                    backgroundColor: isSelected ? `${PRIMARY_GREEN}15` : '#2a2a2a',
                    borderColor: isSelected ? PRIMARY_GREEN : '#3a3a3a',
                    borderWidth: isSelected ? 2 : 1,
                    shadowColor: isSelected ? PRIMARY_GREEN : '#000',
                    shadowOpacity: isSelected ? 0.2 : 0.1,
                    shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
                    shadowRadius: isSelected ? 16 : 8,
                    elevation: isSelected ? 8 : 4,
                  },
                ]}
                onPress={() => {
                  animateCardPress(cardId, () => setMealFrequency(option.value));
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[
                  styles.mealFrequencyIconContainer,
                  { backgroundColor: isSelected ? `${PRIMARY_GREEN}20` : '#1a1a1a' }
                ]}>
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={isSelected ? PRIMARY_GREEN : colors.textSecondary}
                  />
                </View>
                <View style={styles.mealFrequencyTextContainer}>
                  <Text
                    style={[
                      styles.mealFrequencyLabel,
                      {
                        color: isSelected ? PRIMARY_GREEN : colors.text,
                        fontWeight: isSelected ? Theme.fontWeight.bold : Theme.fontWeight.semibold,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.mealFrequencyDescription,
                      { color: colors.textSecondary }
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkmarkBadge, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  // Step 3: Duration Grid (FIXED - Horizontal scrollable)
  const renderStep3 = () => {
    // Filter duration options based on user email
    // Only allow 30 and 45 day plans for awaisnsolbpo@gmail.com
    const isPremiumUser = user?.email === 'awaisnsolbpo@gmail.com';
    const availableDurations = DurationOptions.filter(option => {
      if (option.value === 30 || option.value === 45) {
        return isPremiumUser;
      }
      return true; // Always show 3, 7, and 14 day options
    });

    return (
      <Animated.View
        style={[
          styles.stepContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.durationScrollContainer}
          style={styles.durationScrollView}
        >
          {availableDurations.map((option) => {
          const isSelected = duration === option.value;
          const cardId = `duration_${option.value}`;
          if (!scaleAnimRefs[cardId]) {
            scaleAnimRefs[cardId] = new Animated.Value(1);
          }
          
          return (
            <Animated.View
              key={option.value}
              style={[
                {
                  transform: [{ scale: scaleAnimRefs[cardId] }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.durationCard,
                  {
                    backgroundColor: isSelected ? `${PRIMARY_GREEN}15` : '#2a2a2a',
                    borderColor: isSelected ? PRIMARY_GREEN : '#3a3a3a',
                    borderWidth: isSelected ? 2 : 1,
                    shadowColor: isSelected ? PRIMARY_GREEN : '#000',
                    shadowOpacity: isSelected ? 0.2 : 0.1,
                    shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
                    shadowRadius: isSelected ? 16 : 8,
                    elevation: isSelected ? 8 : 4,
                  },
                ]}
                onPress={() => {
                  animateCardPress(cardId, () => setDuration(option.value));
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[
                  styles.durationIconContainer,
                  { backgroundColor: isSelected ? `${PRIMARY_GREEN}20` : '#1a1a1a' }
                ]}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={isSelected ? PRIMARY_GREEN : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.durationLabel,
                    {
                      color: isSelected ? PRIMARY_GREEN : colors.text,
                      fontWeight: isSelected ? Theme.fontWeight.bold : Theme.fontWeight.semibold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={[styles.checkmarkBadge, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        </ScrollView>
      </Animated.View>
    );
  };

  // Step 4: Budget Options (2x2 grid)
  const renderStep4 = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.budgetGrid}>
        {BudgetOptions.map((option) => {
          const isSelected = budget === option.value;
          const cardId = `budget_${option.value}`;
          if (!scaleAnimRefs[cardId]) {
            scaleAnimRefs[cardId] = new Animated.Value(1);
          }
          
          return (
            <Animated.View
              key={option.value}
              style={[
                {
                  transform: [{ scale: scaleAnimRefs[cardId] }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.budgetCard,
                  {
                    backgroundColor: isSelected ? `${PRIMARY_GREEN}15` : '#2a2a2a',
                    borderColor: isSelected ? PRIMARY_GREEN : '#3a3a3a',
                    borderWidth: isSelected ? 2 : 1,
                    shadowColor: isSelected ? PRIMARY_GREEN : '#000',
                    shadowOpacity: isSelected ? 0.2 : 0.1,
                    shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
                    shadowRadius: isSelected ? 16 : 8,
                    elevation: isSelected ? 8 : 4,
                  },
                ]}
                onPress={() => {
                  animateCardPress(cardId, () => setBudget(option.value));
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[
                  styles.budgetIconContainer,
                  { backgroundColor: isSelected ? `${PRIMARY_GREEN}20` : '#1a1a1a' }
                ]}>
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={isSelected ? PRIMARY_GREEN : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.budgetLabel,
                    {
                      color: isSelected ? PRIMARY_GREEN : colors.text,
                      fontWeight: isSelected ? Theme.fontWeight.bold : Theme.fontWeight.semibold,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={[styles.budgetDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
                {isSelected && (
                  <View style={[styles.checkmarkBadge, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  // Step 5: Allergies (Chips)
  const renderStep5 = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.chipContainer}>
        {AllergyOptions.map((option) => {
          const isSelected = allergies.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? PRIMARY_GREEN : '#2a2a2a',
                  borderColor: isSelected ? PRIMARY_GREEN : '#3a3a3a',
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => toggleAllergy(option.value)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={isSelected ? '#FFFFFF' : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? Theme.fontWeight.semibold : Theme.fontWeight.medium,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {customAllergies.length > 0 && (
          <>
            {customAllergies.map((allergy, index) => (
              <View key={`custom_${allergy}_${index}`} style={styles.customChipContainer}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    styles.customChip,
                    {
                      backgroundColor: PRIMARY_GREEN,
                      borderColor: PRIMARY_GREEN,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.chipText, { color: '#FFFFFF', fontWeight: Theme.fontWeight.semibold }]}>
                    {allergy}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeCustomAllergy(allergy)}
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.addCustomButton,
          {
            backgroundColor: '#2a2a2a',
            borderColor: PRIMARY_GREEN,
            borderWidth: 2,
            borderStyle: 'dashed',
          },
        ]}
        onPress={() => setShowCustomAllergyModal(true)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add-circle-outline" size={24} color={PRIMARY_GREEN} />
        <Text style={[styles.addCustomText, { color: PRIMARY_GREEN }]}>
          Add Custom Allergy
        </Text>
      </TouchableOpacity>
      
      <View style={[styles.hintCard, { backgroundColor: '#2a2a2a' }]}>
        <Ionicons name="information-circle-outline" size={20} color={PRIMARY_GREEN} />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          We'll ensure your meal plan avoids these allergens
        </Text>
      </View>
    </Animated.View>
  );

  // Step 6: Health Conditions (Chips)
  const renderStep6 = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.chipContainer}>
        {HealthConditionOptions.map((option) => {
          const isSelected = healthConditions.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? PRIMARY_GREEN : '#2a2a2a',
                  borderColor: isSelected ? PRIMARY_GREEN : '#3a3a3a',
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => toggleHealthCondition(option.value)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={isSelected ? '#FFFFFF' : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? Theme.fontWeight.semibold : Theme.fontWeight.medium,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {customHealthConditions.length > 0 && (
          <>
            {customHealthConditions.map((condition, index) => (
              <View key={`custom_${condition}_${index}`} style={styles.customChipContainer}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    styles.customChip,
                    {
                      backgroundColor: PRIMARY_GREEN,
                      borderColor: PRIMARY_GREEN,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="medical" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.chipText, { color: '#FFFFFF', fontWeight: Theme.fontWeight.semibold }]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeCustomCondition(condition)}
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.addCustomButton,
          {
            backgroundColor: '#2a2a2a',
            borderColor: PRIMARY_GREEN,
            borderWidth: 2,
            borderStyle: 'dashed',
          },
        ]}
        onPress={() => setShowCustomConditionModal(true)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add-circle-outline" size={24} color={PRIMARY_GREEN} />
        <Text style={[styles.addCustomText, { color: PRIMARY_GREEN }]}>
          Add Custom Condition
        </Text>
      </TouchableOpacity>
      
      <View style={[styles.hintCard, { backgroundColor: '#2a2a2a' }]}>
        <Ionicons name="medical-outline" size={20} color={PRIMARY_GREEN} />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          This helps us create a meal plan suitable for your health needs
        </Text>
      </View>
    </Animated.View>
  );

  // Step 7: Custom Questions (Text Input)
  const renderStep7 = () => {
    return (
      <Animated.View
        style={[
          styles.stepContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TextInput
          style={[
            styles.customInput,
            {
              backgroundColor: '#2a2a2a',
              color: colors.text,
              borderColor: isInputFocused ? PRIMARY_GREEN : '#3a3a3a',
              borderWidth: 2,
            },
          ]}
          value={customQuestions}
          onChangeText={setCustomQuestions}
          placeholder="E.g., I prefer quick meals, I love spicy food, I'm a beginner cook, I need high protein meals..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          maxLength={500}
          returnKeyType="done"
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          textAlignVertical="top"
        />
        <View style={styles.characterCountContainer}>
          <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
            {customQuestions.length}/500 characters
          </Text>
        </View>
        <View style={[styles.hintCard, { backgroundColor: '#2a2a2a' }]}>
          <Ionicons name="bulb-outline" size={20} color={PRIMARY_GREEN} />
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            This helps us create a more personalized meal plan for you
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
        <View style={[styles.modalContent, { backgroundColor: '#0a0a0a' }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: '#1a1a1a' }]}>
            <View style={styles.modalHeaderLeft}>
              {step > 1 && (
                <TouchableOpacity
                  onPress={handleBack}
                  style={[styles.backButton, { backgroundColor: '#1a1a1a' }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
              )}
              <View style={styles.headerTextContainer}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
                  {getStepTitle()}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                  {getStepDescription()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: '#1a1a1a' }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Content */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderStepContent()}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: '#1a1a1a', backgroundColor: '#0a0a0a' }]}>
            {step > 1 && (
              <Button
                title="Back"
                variant="outline"
                onPress={handleBack}
                style={styles.footerButton}
              />
            )}
            <Button
              title={step === TOTAL_STEPS ? 'Generate Plan' : 'Next'}
              onPress={handleNext}
              style={[styles.footerButton, { flex: 1 }]}
              icon={
                step === TOTAL_STEPS ? (
                  <View style={{ marginRight: 8 }}>
                    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={{ marginRight: 8 }}>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                )
              }
            />
          </View>
        </View>
      </SafeAreaView>
      
      {/* Custom Input Modals */}
      <CustomInputModal
        visible={showCustomAllergyModal}
        onClose={() => setShowCustomAllergyModal(false)}
        onAdd={addCustomAllergy}
        title="Add Custom Allergy"
        placeholder="e.g., Peanuts, Sesame, etc."
        type="allergy"
      />
      <CustomInputModal
        visible={showCustomConditionModal}
        onClose={() => setShowCustomConditionModal(false)}
        onAdd={addCustomCondition}
        title="Add Custom Health Condition"
        placeholder="e.g., IBS, Celiac Disease, etc."
        type="condition"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '94%',
    flex: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    paddingTop: Theme.spacing.xl,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: 4,
    lineHeight: 28,
  },
  modalSubtitle: {
    fontSize: Theme.fontSize.base,
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Theme.fontSize.xs,
    textAlign: 'right',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxl,
  },
  stepContent: {
    flex: 1,
    width: '100%',
  },
  
  // Step 1: Goals Grid
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'space-between',
  },
  goalCard: {
    width: GOAL_CARD_WIDTH,
    height: GOAL_CARD_HEIGHT,
    padding: CARD_PADDING,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  goalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
  },
  
  // Step 2: Meal Frequency
  mealFrequencyContainer: {
    gap: 12,
  },
  mealFrequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    minHeight: 120,
    position: 'relative',
  },
  mealFrequencyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mealFrequencyTextContainer: {
    flex: 1,
  },
  mealFrequencyLabel: {
    fontSize: Theme.fontSize.lg,
    marginBottom: 4,
  },
  mealFrequencyDescription: {
    fontSize: Theme.fontSize.sm,
  },
  
  // Step 3: Duration Grid (FIXED)
  durationScrollView: {
    flexGrow: 0,
  },
  durationScrollContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: DURATION_GAP,
  },
  durationCard: {
    width: DURATION_CARD_WIDTH,
    height: DURATION_CARD_HEIGHT,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  durationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationLabel: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
  },
  
  // Step 4: Budget Grid
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'space-between',
  },
  budgetCard: {
    width: GOAL_CARD_WIDTH,
    height: GOAL_CARD_HEIGHT,
    padding: CARD_PADDING,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  budgetIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
    marginBottom: 4,
  },
  budgetDescription: {
    fontSize: Theme.fontSize.xs,
    textAlign: 'center',
  },
  
  // Checkmark Badge
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Step 5 & 6: Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Theme.spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    minHeight: 44,
  },
  chipText: {
    fontSize: Theme.fontSize.base,
  },
  customChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customChip: {
    flex: 1,
    minHeight: 44,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  addCustomText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  hintText: {
    flex: 1,
    fontSize: Theme.fontSize.base,
    lineHeight: 20,
  },
  
  // Step 7: Custom Input
  customInput: {
    borderRadius: 16,
    padding: 16,
    fontSize: Theme.fontSize.base,
    marginBottom: 8,
    minHeight: 160,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  characterCount: {
    fontSize: Theme.fontSize.xs,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    padding: Theme.spacing.xl,
    gap: Theme.spacing.md,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? Theme.spacing.xl : Theme.spacing.lg,
  },
  footerButton: {
    minWidth: 100,
  },
});
