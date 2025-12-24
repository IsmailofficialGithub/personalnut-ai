import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from './Card';
import { Button } from './Button';
import { Theme } from '../constants/Theme';

const ActivityLevels = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Very hard exercise, physical job' },
];

const DietaryPreferences = [
  'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'paleo', 'low_carb', 'mediterranean',
];

export const OnboardingQuestionsModal = ({ visible, profile, onClose, onSubmit }) => {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: profile?.age?.toString() || '',
    weight: profile?.weight?.toString() || '',
    height: profile?.height?.toString() || '',
    weight_goal: profile?.weight_goal?.toString() || '',
    activity_level: profile?.activity_level || '',
    dietary_preferences: profile?.dietary_preferences || [],
  });

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const togglePreference = (pref) => {
    setFormData(prev => {
      const prefs = prev.dietary_preferences || [];
      const exists = prefs.includes(pref);
      return {
        ...prev,
        dietary_preferences: exists
          ? prefs.filter(p => p !== pref)
          : [...prefs, pref],
      };
    });
  };

  const validateStep = (stepNum) => {
    if (stepNum === 1) {
      if (!formData.age || !formData.weight || !formData.height || !formData.weight_goal) {
        Alert.alert('Missing Information', 'Please fill in all required fields.');
        return false;
      }
      if (isNaN(parseInt(formData.age)) || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
        Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120.');
        return false;
      }
      if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
        Alert.alert('Invalid Weight', 'Please enter a valid weight.');
        return false;
      }
      if (isNaN(parseFloat(formData.height)) || parseFloat(formData.height) <= 0) {
        Alert.alert('Invalid Height', 'Please enter a valid height.');
        return false;
      }
      if (isNaN(parseFloat(formData.weight_goal)) || parseFloat(formData.weight_goal) <= 0) {
        Alert.alert('Invalid Target Weight', 'Please enter a valid target weight.');
        return false;
      }
    } else if (stepNum === 2) {
      if (!formData.activity_level) {
        Alert.alert('Missing Information', 'Please select your activity level.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 2) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    // Calculate calorie goal
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);
    let daily_calorie_goal = profile?.daily_calorie_goal || 2000;
    
    if (weight && height && age && formData.activity_level) {
      // Mifflin-St Jeor Equation
      let bmr;
      const gender = profile?.gender || 'male'; // Default to male if not specified
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };

      const tdee = bmr * (activityMultipliers[formData.activity_level] || 1.5);
      daily_calorie_goal = Math.round(tdee);
    }

    onSubmit({
      ...formData,
      age: parseInt(formData.age),
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      weight_goal: parseFloat(formData.weight_goal),
      daily_calorie_goal: daily_calorie_goal,
    });
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      age: profile?.age?.toString() || '',
      weight: profile?.weight?.toString() || '',
      height: profile?.height?.toString() || '',
      weight_goal: profile?.weight_goal?.toString() || '',
      activity_level: profile?.activity_level || '',
      dietary_preferences: profile?.dietary_preferences || [],
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Update Your Information
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <Card style={styles.stepCard}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  Basic Information
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Age</Text>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    value={formData.age}
                    onChangeText={(v) => updateFormData('age', v)}
                    placeholder="Enter your age"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Current Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    value={formData.weight}
                    onChangeText={(v) => updateFormData('weight', v)}
                    placeholder="Enter your weight"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Height (cm)</Text>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    value={formData.height}
                    onChangeText={(v) => updateFormData('height', v)}
                    placeholder="Enter your height"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Target Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    value={formData.weight_goal}
                    onChangeText={(v) => updateFormData('weight_goal', v)}
                    placeholder="Enter your goal weight"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </Card>
            )}

            {step === 2 && (
              <Card style={styles.stepCard}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  Activity Level
                </Text>

                {ActivityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: formData.activity_level === level.value
                          ? colors.primary + '20'
                          : colors.surface,
                        borderColor: formData.activity_level === level.value
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => updateFormData('activity_level', level.value)}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>
                        {level.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                        {level.description}
                      </Text>
                    </View>
                    {formData.activity_level === level.value && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}

                <Text style={[styles.stepTitle, { color: colors.text, marginTop: Theme.spacing.lg }]}>
                  Dietary Preferences (Optional)
                </Text>

                <View style={styles.preferencesGrid}>
                  {DietaryPreferences.map((pref) => (
                    <TouchableOpacity
                      key={pref}
                      style={[
                        styles.preferenceTag,
                        {
                          backgroundColor: formData.dietary_preferences?.includes(pref)
                            ? colors.primary + '20'
                            : colors.surface,
                          borderColor: formData.dietary_preferences?.includes(pref)
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => togglePreference(pref)}
                    >
                      <Text
                        style={[
                          styles.preferenceText,
                          {
                            color: formData.dietary_preferences?.includes(pref)
                              ? colors.primary
                              : colors.text,
                            fontWeight: formData.dietary_preferences?.includes(pref)
                              ? Theme.fontWeight.semibold
                              : Theme.fontWeight.normal,
                          },
                        ]}
                      >
                        {pref.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            )}

            <View style={styles.buttonContainer}>
              {step > 1 && (
                <Button
                  title="Back"
                  variant="outline"
                  onPress={() => setStep(step - 1)}
                  style={styles.button}
                />
              )}
              <Button
                title={step === 2 ? 'Create Plan' : 'Next'}
                onPress={handleNext}
                style={[styles.button, { flex: step === 1 ? 1 : 1 }]}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    maxHeight: Platform.OS === 'ios' ? '90%' : '95%',
    paddingBottom: Platform.OS === 'ios' ? 0 : Theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  stepCard: {
    marginBottom: Theme.spacing.lg,
  },
  stepTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: Theme.spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
  },
  optionDescription: {
    fontSize: Theme.fontSize.sm,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  preferenceTag: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
  },
  preferenceText: {
    fontSize: Theme.fontSize.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  button: {
    flex: 1,
  },
});

