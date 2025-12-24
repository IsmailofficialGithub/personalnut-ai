import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/Theme';
import { format } from 'date-fns';

export const DayDetailModal = ({ visible, onClose, day, mealFrequency }) => {
  const { colors } = useTheme();

  if (!day) return null;

  const renderMealDetail = (meal, mealType, icon, iconColor) => {
    if (!meal) return null;
    
    return (
      <View key={mealType} style={[styles.mealDetailCard, { backgroundColor: colors.surface }]}>
        <View style={styles.mealDetailHeader}>
          <View style={[styles.mealIconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.mealDetailTitleContainer}>
            <Text style={[styles.mealTypeLabel, { color: colors.textSecondary }]}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
            <Text style={[styles.mealDetailName, { color: colors.text }]}>
              {meal.name}
            </Text>
          </View>
          <View style={[styles.calorieBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.calorieText, { color: colors.primary }]}>
              {meal.calories} cal
            </Text>
          </View>
        </View>
        
        {meal.description && (
          <Text style={[styles.mealDescription, { color: colors.textSecondary }]}>
            {meal.description}
          </Text>
        )}
        
        {meal.ingredients && meal.ingredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={[styles.ingredientsLabel, { color: colors.text }]}>
              Ingredients:
            </Text>
            <View style={styles.ingredientsList}>
              {meal.ingredients.map((ingredient, idx) => (
                <View key={idx} style={[styles.ingredientTag, { backgroundColor: colors.card }]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={[styles.ingredientText, { color: colors.text }]}>
                    {ingredient}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const totalCalories = day.total_calories || 
    (day.meals?.breakfast?.calories || 0) +
    (day.meals?.lunch?.calories || 0) +
    (day.meals?.dinner?.calories || 0) +
    (day.meals?.snacks?.reduce((sum, snack) => sum + (snack.calories || 0), 0) || 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.dayBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.dayBadgeText}>Day {day.day}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  {totalCalories} total calories
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderMealDetail(day.meals?.breakfast, 'Breakfast', 'sunny', '#FFB74D')}
            {renderMealDetail(day.meals?.lunch, 'Lunch', 'fast-food', '#4CAF50')}
            {renderMealDetail(day.meals?.dinner, 'Dinner', 'restaurant', '#FF9800')}
            
            {day.meals?.snacks && day.meals.snacks.map((snack, idx) => 
              renderMealDetail(snack, `Snack ${idx + 1}`, 'nutrition', '#9C27B0')
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: Theme.borderRadius.xl * 2,
    borderTopRightRadius: Theme.borderRadius.xl * 2,
    overflow: 'hidden',
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
  dayBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Theme.fontSize.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  mealDetailCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  mealDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealDetailTitleContainer: {
    flex: 1,
  },
  mealTypeLabel: {
    fontSize: Theme.fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs / 2,
  },
  mealDetailName: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  calorieBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
  },
  calorieText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  mealDescription: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
    marginBottom: Theme.spacing.md,
  },
  ingredientsContainer: {
    marginTop: Theme.spacing.sm,
  },
  ingredientsLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.sm,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
    gap: Theme.spacing.xs,
  },
  ingredientText: {
    fontSize: Theme.fontSize.sm,
  },
});

