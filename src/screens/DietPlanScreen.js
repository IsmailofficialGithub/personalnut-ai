import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DietPlanOptionsModal } from '../components/DietPlanOptionsModal';
import { DietPlanLoadingModal } from '../components/DietPlanLoadingModal';
import { DayDetailModal } from '../components/DayDetailModal';
import { generateDietPlan } from '../services/openai';
import { supabase } from '../services/supabase';
import { Theme } from '../constants/Theme';
import { format } from 'date-fns';
import { PageContainer } from '../components/PageContainer';

export const DietPlanScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [activePlan, setActivePlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [showPlanOptionsModal, setShowPlanOptionsModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllPlans(data || []);
      const active = (data || []).find(p => p.is_active) || (data || [])[0];
      setActivePlan(active);
      
      // If there's an active plan, show it in detail view
      if (active && data.length > 0) {
        setViewMode('list'); // Start with list view by default
      }
    } catch (error) {
      console.error('Error loading diet plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchPlan = async (planId) => {
    try {
      // Deactivate all plans
      await supabase
        .from('diet_plans')
        .update({ is_active: false })
        .eq('user_id', profile.id);

      // Activate selected plan
      const { error } = await supabase
        .from('diet_plans')
        .update({ is_active: true })
        .eq('id', planId);

      if (error) throw error;
      await loadPlans();
      setViewMode('detail'); // Switch to detail view after selecting
    } catch (error) {
      Alert.alert('Oops!', 'We couldn\'t switch your plan. Please try again.');
    }
  };

  const deletePlan = async (planId) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this diet plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('diet_plans')
                .delete()
                .eq('id', planId);

              if (error) throw error;
              await loadPlans();
              Alert.alert('Deleted!', 'Your diet plan has been removed');
            } catch (error) {
              Alert.alert('Oops!', 'We couldn\'t delete this plan. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePlanOptionsSubmit = async (options) => {
    setShowPlanOptionsModal(false);
    setShowLoadingModal(true);
    await createNewPlan(options);
    setShowLoadingModal(false);
  };

  const createNewPlan = async (options) => {
    setGenerating(true);
    try {
      // Calculate calorie goal
      let calorieGoal = profile.daily_calorie_goal;
      
      if (!calorieGoal && profile.weight && profile.height && profile.age) {
        const weight = parseFloat(profile.weight);
        const height = parseFloat(profile.height);
        const age = parseInt(profile.age);
        
        let bmr;
        const gender = profile.gender || 'male';
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

        const activityLevel = profile.activity_level || 'moderate';
        const tdee = bmr * (activityMultipliers[activityLevel] || 1.5);
        calorieGoal = Math.round(tdee);
      }
      
      // Deactivate all existing plans
      await supabase
        .from('diet_plans')
        .update({ is_active: false })
        .eq('user_id', profile.id);

      const goals = options.goals || ['weight_loss', 'healthy_eating'];
      const duration = options.duration || 7;
      const budget = options.budget || 'flexible';
      const mealFrequency = options.mealFrequency || 3;
      const allergies = options.allergies || [];
      const healthConditions = options.healthConditions || [];
      const customQuestions = options.customQuestions || '';
      const plan = await generateDietPlan(
        profile,
        goals,
        duration,
        budget,
        customQuestions,
        mealFrequency,
        allergies,
        healthConditions
      );

      // Optimize plan size if needed to prevent database errors
      const planJsonString = JSON.stringify(plan);
      if (planJsonString.length > 100000) { // 100KB limit
        console.warn('Plan is large, optimizing descriptions...');
        plan.days = plan.days.map(day => ({
          ...day,
          meals: {
            ...day.meals,
            breakfast: { 
              ...day.meals.breakfast, 
              description: day.meals.breakfast.description?.substring(0, 50) 
            },
            lunch: { 
              ...day.meals.lunch, 
              description: day.meals.lunch.description?.substring(0, 50) 
            },
            dinner: { 
              ...day.meals.dinner, 
              description: day.meals.dinner.description?.substring(0, 50) 
            },
            snacks: day.meals.snacks?.map(snack => ({ 
              ...snack, 
              description: snack.description?.substring(0, 50) 
            }))
          }
        }));
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .insert({
          user_id: profile.id,
          plan_name: plan.plan_name,
          daily_calorie_goal: calorieGoal || 2000,
          meal_plan: plan,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      await loadPlans();
      setViewMode('detail'); // Show the new plan
      Alert.alert('Plan Ready! 🎉', 'Your personalized diet plan is ready to go!');
    } catch (error) {
      console.error('Error generating diet plan:', error);
      setShowLoadingModal(false);
      Alert.alert('Error', `Failed to generate diet plan: ${error.message || 'Please try again.'}`);
    } finally {
      setGenerating(false);
    }
  };

  const shareDietPlan = async () => {
    if (!activePlan) return;

    setSharing(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: `Check out my personalized diet plan: ${activePlan.plan_name}! 🥗✨`,
          post_type: 'meal',
          shared_diet_plan_id: activePlan.id,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;
      Alert.alert(
        'Success',
        'Your diet plan has been shared to the community!',
        [
          {
            text: 'View in Community',
            onPress: () => navigation.navigate('Community'),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error sharing diet plan:', error);
      Alert.alert('Error', 'Failed to share diet plan. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const renderMeal = (meal, icon, iconColor) => (
    <View style={styles.mealItem}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <View style={styles.mealInfo}>
        <Text style={[styles.mealName, { color: colors.text }]}>
          {meal.name}
        </Text>
        <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>
          {meal.calories} cal
        </Text>
        {meal.description && (
          <Text style={[styles.mealDescription, { color: colors.textSecondary }]}>
            {meal.description}
          </Text>
        )}
      </View>
    </View>
  );

  const renderPlanListItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        {
          backgroundColor: item.is_active ? colors.primary + '15' : colors.card,
          borderColor: item.is_active ? colors.primary : colors.border,
        },
      ]}
      onPress={() => {
        setActivePlan(item);
        setViewMode('detail');
      }}
    >
      <View style={styles.planCardHeader}>
        <View style={styles.planCardTitleRow}>
          <Ionicons 
            name={item.is_active ? "checkmark-circle" : "restaurant-outline"} 
            size={24} 
            color={item.is_active ? colors.primary : colors.textSecondary} 
          />
          <View style={styles.planCardTitleContainer}>
            <Text style={[styles.planCardTitle, { color: colors.text }]}>
              {item.plan_name || item.meal_plan?.plan_name}
            </Text>
            {item.is_active && (
              <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => deletePlan(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.planCardDetails}>
        <View style={styles.planCardDetail}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.planCardDetailText, { color: colors.textSecondary }]}>
            {format(new Date(item.created_at), 'MMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.planCardDetail}>
          <Ionicons name="flame-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.planCardDetailText, { color: colors.textSecondary }]}>
            {item.daily_calorie_goal || item.daily_calorie_target || 2000} cal/day
          </Text>
        </View>
        <View style={styles.planCardDetail}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.planCardDetailText, { color: colors.textSecondary }]}>
            {item.meal_plan?.days?.length || 7} days
          </Text>
        </View>
      </View>

      {!item.is_active && (
        <Button
          title="Set as Active"
          variant="outline"
          size="small"
          onPress={() => switchPlan(item.id)}
          style={styles.setActiveButton}
        />
      )}
    </TouchableOpacity>
  );

  const renderDayCard = (day) => {
    return (
      <TouchableOpacity
        key={day.day}
        style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          setSelectedDay(day);
          setShowDayDetail(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleContainer}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
              Day {day.day}
            </Text>
            <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
              {format(new Date(day.date), 'MMM d')}
            </Text>
          </View>
          <View style={styles.dayHeaderRight}>
            <Text style={[styles.dayCalories, { color: colors.primary }]}>
              {day.total_calories} cal
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={colors.textSecondary} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </PageContainer>
    );
  }

  // Empty state - no plans at all
  if (allPlans.length === 0) {
    return (
      <PageContainer>
        <ScrollView contentContainerStyle={[styles.emptyContainer, { flex: 1 }]}>
          <Ionicons name="restaurant-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Ready for Your Plan? 🎯
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Our AI nutritionist will create a personalized meal plan just for you
          </Text>
          <Button
            title={generating ? 'Creating Your Plan...' : 'Create My Plan'}
            onPress={() => {
              if (!profile?.age || !profile?.weight || !profile?.height || !profile?.activity_level) {
                Alert.alert(
                  'Complete Your Profile',
                  'Please complete your profile information in the Profile tab before generating a diet plan.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
                  ]
                );
              } else {
                setShowPlanOptionsModal(true);
              }
            }}
            loading={generating}
            style={styles.generateButton}
          />
        </ScrollView>

        <DietPlanOptionsModal
          visible={showPlanOptionsModal}
          onClose={() => setShowPlanOptionsModal(false)}
          onSubmit={handlePlanOptionsSubmit}
          profile={profile}
        />
        <DietPlanLoadingModal
          visible={showLoadingModal}
          onClose={() => setShowLoadingModal(false)}
        />
      </PageContainer>
    );
  }

  // List view - show all plans
  if (viewMode === 'list') {
    return (
      <PageContainer>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Diet Plans</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (!profile?.age || !profile?.weight || !profile?.height || !profile?.activity_level) {
                Alert.alert(
                  'Complete Your Profile',
                  'Please complete your profile information in the Profile tab before generating a diet plan.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
                  ]
                );
              } else {
                setShowPlanOptionsModal(true);
              }
            }}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={allPlans}
          keyExtractor={item => item.id}
          renderItem={renderPlanListItem}
          contentContainerStyle={styles.plansList}
          showsVerticalScrollIndicator={false}
        />

        <DietPlanOptionsModal
          visible={showPlanOptionsModal}
          onClose={() => setShowPlanOptionsModal(false)}
          onSubmit={handlePlanOptionsSubmit}
          profile={profile}
        />
        <DietPlanLoadingModal
          visible={showLoadingModal}
          onClose={() => setShowLoadingModal(false)}
        />
      </PageContainer>
    );
  }

  // Detail view - show selected plan
  const mealPlan = activePlan?.meal_plan;

  return (
    <PageContainer>
      <View style={styles.detailHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.detailHeaderTitle, { color: colors.text }]} numberOfLines={1}>
          {mealPlan?.plan_name}
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareDietPlan}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.detailContent}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Started</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {format(new Date(activePlan.created_at), 'MMM d')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="flame" size={20} color={colors.primary} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Daily Target</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {activePlan.daily_calorie_goal || activePlan.daily_calorie_target || 2000} cal
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {mealPlan?.days?.length || 7} days
              </Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Meal Plans</Text>
        {mealPlan?.days && mealPlan.days.map(day => renderDayCard(day))}

        {mealPlan?.tips && mealPlan.tips.length > 0 && (
          <Card style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color={colors.primary} />
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Tips for Success
              </Text>
            </View>
            {mealPlan.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <DietPlanOptionsModal
        visible={showPlanOptionsModal}
        onClose={() => setShowPlanOptionsModal(false)}
        onSubmit={handlePlanOptionsSubmit}
      />
      <DayDetailModal
        visible={showDayDetail}
        onClose={() => {
          setShowDayDetail(false);
          setSelectedDay(null);
        }}
        day={selectedDay}
        mealFrequency={activePlan?.meal_plan?.days?.[0]?.meals ? 
          (Object.keys(activePlan.meal_plan.days[0].meals).length - (activePlan.meal_plan.days[0].meals.snacks ? 1 : 0) + (activePlan.meal_plan.days[0].meals.snacks?.length || 0)) : 3
        }
      />
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    lineHeight: 24,
  },
  generateButton: {
    minWidth: 250,
    marginTop: Theme.spacing.md,
  },
  
  // List View Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plansList: {
    padding: Theme.spacing.lg,
    paddingTop: 0,
  },
  planCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 2,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  planCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  planCardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  planCardTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
  },
  planCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  planCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  planCardDetailText: {
    fontSize: Theme.fontSize.sm,
  },
  setActiveButton: {
    marginTop: Theme.spacing.sm,
  },
  
  // Detail View Styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
  },
  backButton: {
    padding: Theme.spacing.xs,
  },
  detailHeaderTitle: {
    flex: 1,
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginHorizontal: Theme.spacing.md,
  },
  shareButton: {
    padding: Theme.spacing.xs,
  },
  detailContent: {
    padding: Theme.spacing.lg,
    paddingTop: 0,
  },
  summaryCard: {
    marginBottom: Theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  summaryLabel: {
    fontSize: Theme.fontSize.xs,
    marginTop: Theme.spacing.xs,
  },
  summaryValue: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.bold,
    marginTop: Theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  dayCard: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitleContainer: {
    flex: 1,
  },
  dayTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  dayDate: {
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  dayCalories: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  mealsContainer: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: Theme.spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    alignItems: 'flex-start',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
  },
  mealCalories: {
    fontSize: Theme.fontSize.sm,
    marginBottom: Theme.spacing.xs,
  },
  mealDescription: {
    fontSize: Theme.fontSize.sm,
    lineHeight: 18,
  },
  tipsCard: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xxl,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  tipsTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  tipItem: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: Theme.fontSize.sm,
    lineHeight: 20,
  },
});