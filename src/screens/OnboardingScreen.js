import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Theme } from '../constants/Theme';

export const OnboardingScreen = () => {
  const { updateProfile } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    weight: '',
    height: '',
    weight_goal: '',
    activity_level: '',
    dietary_preferences: [],
    health_conditions: [],
    allergies: [],
  });

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, item) => {
    setFormData(prev => {
      const array = prev[key];
      const exists = array.includes(item);
      return {
        ...prev,
        [key]: exists
          ? array.filter(i => i !== item)
          : [...array, item],
      };
    });
  };

  const validateStep = (stepNumber) => {
    if (stepNumber === 1) {
      if (!formData.age || !formData.gender || !formData.weight || !formData.height || !formData.weight_goal) {
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
    } else if (stepNumber === 2) {
      if (!formData.activity_level) {
        Alert.alert('Missing Information', 'Please select your activity level.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const calculateCalorieGoal = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);
    
    if (!weight || !height || !age || !formData.gender) return 2000;

    // Mifflin-St Jeor Equation
    let bmr;
    if (formData.gender === 'male') {
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
    return Math.round(tdee);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    setLoading(true);
    
    try {
      const daily_calorie_goal = calculateCalorieGoal();
      
      // Only include fields that exist in the database schema
      const profileUpdate = {
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        weight_goal: formData.weight_goal ? parseFloat(formData.weight_goal) : null,
        gender: formData.gender,
        activity_level: formData.activity_level,
        dietary_preferences: formData.dietary_preferences || [],
        daily_calorie_goal,
      };

      // Add health_conditions and allergies only if columns exist (will be added via SQL migration)
      // For now, filter out these fields if database doesn't support them
      // After running add_profile_columns.sql, these can be included
      if (formData.health_conditions?.length > 0) {
        profileUpdate.health_conditions = formData.health_conditions;
      }
      if (formData.allergies?.length > 0) {
        profileUpdate.allergies = formData.allergies;
      }

      const { data, error } = await updateProfile(profileUpdate);

      if (error) {
        console.error('Profile save error:', error);
        const errorMessage = error.message || 'Failed to save profile. Please try again.';
        Alert.alert('Error', errorMessage);
      } else {
        // Profile updated successfully - navigation will happen automatically via AppNavigator
        Alert.alert('Success', 'Profile setup completed successfully!');
      }
    } catch (error) {
      console.error('Unexpected error saving profile:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Tell us about yourself
      </Text>
      
      <Input
        label="Age"
        value={formData.age}
        onChangeText={(v) => updateFormData('age', v)}
        placeholder="Enter your age"
        keyboardType="numeric"
        icon={<Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />}
      />

      <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
      <View style={styles.optionsRow}>
        {['male', 'female', 'other'].map(gender => (
          <TouchableOpacity
            key={gender}
            onPress={() => updateFormData('gender', gender)}
            style={[
              styles.option,
              {
                backgroundColor: formData.gender === gender ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: formData.gender === gender ? '#FFFFFF' : colors.text,
                },
              ]}
            >
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Current Weight (kg)"
        value={formData.weight}
        onChangeText={(v) => updateFormData('weight', v)}
        placeholder="Enter your weight"
        keyboardType="decimal-pad"
        icon={<Ionicons name="fitness-outline" size={20} color={colors.textSecondary} />}
      />

      <Input
        label="Height (cm)"
        value={formData.height}
        onChangeText={(v) => updateFormData('height', v)}
        placeholder="Enter your height"
        keyboardType="decimal-pad"
        icon={<Ionicons name="resize-outline" size={20} color={colors.textSecondary} />}
      />

      <Input
        label="Target Weight (kg)"
        value={formData.weight_goal}
        onChangeText={(v) => updateFormData('weight_goal', v)}
        placeholder="Enter your goal weight"
        keyboardType="decimal-pad"
        icon={<Ionicons name="trophy-outline" size={20} color={colors.textSecondary} />}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Activity Level
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        This helps us calculate your daily calorie needs
      </Text>

      {[
        { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
        { value: 'light', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
        { value: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
        { value: 'active', label: 'Active', desc: 'Exercise 6-7 days/week' },
        { value: 'very_active', label: 'Very Active', desc: 'Intense exercise daily' },
      ].map(activity => (
        <TouchableOpacity
          key={activity.value}
          onPress={() => updateFormData('activity_level', activity.value)}
          style={[
            styles.activityCard,
            {
              backgroundColor: formData.activity_level === activity.value
                ? colors.primary
                : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.activityLabel,
              {
                color: formData.activity_level === activity.value
                  ? '#FFFFFF'
                  : colors.text,
              },
            ]}
          >
            {activity.label}
          </Text>
          <Text
            style={[
              styles.activityDesc,
              {
                color: formData.activity_level === activity.value
                  ? '#FFFFFF'
                  : colors.textSecondary,
              },
            ]}
          >
            {activity.desc}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Dietary Preferences & Health
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Dietary Preferences (Optional)</Text>
      <View style={styles.chipContainer}>
        {['vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal', 'kosher'].map(diet => (
          <TouchableOpacity
            key={diet}
            onPress={() => toggleArrayItem('dietary_preferences', diet)}
            style={[
              styles.chip,
              {
                backgroundColor: formData.dietary_preferences.includes(diet)
                  ? colors.primary
                  : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: formData.dietary_preferences.includes(diet)
                    ? '#FFFFFF'
                    : colors.text,
                },
              ]}
            >
              {diet.charAt(0).toUpperCase() + diet.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Health Conditions (Optional)</Text>
      <View style={styles.chipContainer}>
        {['diabetes', 'hypertension', 'heart_disease', 'high_cholesterol', 'none'].map(condition => (
          <TouchableOpacity
            key={condition}
            onPress={() => toggleArrayItem('health_conditions', condition)}
            style={[
              styles.chip,
              {
                backgroundColor: formData.health_conditions.includes(condition)
                  ? colors.primary
                  : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: formData.health_conditions.includes(condition)
                    ? '#FFFFFF'
                    : colors.text,
                },
              ]}
            >
              {condition.replace('_', ' ').charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Allergies (Optional)</Text>
      <View style={styles.chipContainer}>
        {['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'shellfish', 'none'].map(allergy => (
          <TouchableOpacity
            key={allergy}
            onPress={() => toggleArrayItem('allergies', allergy)}
            style={[
              styles.chip,
              {
                backgroundColor: formData.allergies.includes(allergy)
                  ? colors.primary
                  : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: formData.allergies.includes(allergy)
                    ? '#FFFFFF'
                    : colors.text,
                },
              ]}
            >
              {allergy.charAt(0).toUpperCase() + allergy.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Welcome to GRAM AI
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Step {step} of 3
        </Text>
        <View style={styles.progressBar}>
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                {
                  backgroundColor: i <= step ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.buttonRow}>
          {step > 1 && (
            <Button
              title="Back"
              variant="outline"
              onPress={() => setStep(step - 1)}
              style={styles.button}
            />
          )}
          {step < 3 ? (
            <Button
              title="Next"
              onPress={handleNext}
              style={[styles.button, step > 1 ? {} : { flex: 1 }]}
            />
          ) : (
            <Button
              title="Complete Setup"
              onPress={handleSubmit}
              loading={loading}
              style={styles.button}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Theme.spacing.xxl + 40,
    paddingBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Theme.fontSize.base,
    marginBottom: Theme.spacing.md,
  },
  progressBar: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  stepTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  stepSubtitle: {
    fontSize: Theme.fontSize.base,
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  option: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium,
  },
  activityCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: Theme.spacing.md,
  },
  activityLabel: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
  },
  activityDesc: {
    fontSize: Theme.fontSize.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  chip: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
  },
  footer: {
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  button: {
    flex: 1,
  },
});