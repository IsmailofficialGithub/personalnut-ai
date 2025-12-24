import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Theme } from '../constants/Theme';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';
import { MealDetailModal } from '../components/MealDetailModal';
import { PageContainer } from '../components/PageContainer';

export const HomeScreen = ({ navigation }) => {
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();
  const [dailyStats, setDailyStats] = useState(null);
  const [recentMeals, setRecentMeals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  // Use local asset for header image
  const headerImage = require('../../assets/dashboard-header.png');

  useEffect(() => {
    if (!profile?.id) return;

    // Load initial data
    loadDashboardData();

    // Set up real-time subscription for food_entries
    const foodEntriesChannel = supabase
      .channel('food_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'food_entries',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('Food entry changed:', payload.eventType);
          // Reload dashboard data when food entries change
          loadDashboardData();
        }
      )
      .subscribe();

    // Set up real-time subscription for daily_stats
    const dailyStatsChannel = supabase
      .channel('daily_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'daily_stats',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('Daily stats changed:', payload.eventType);
          // Reload dashboard data when daily stats change
      loadDashboardData();
    }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(foodEntriesChannel);
      supabase.removeChannel(dailyStatsChannel);
    };
  }, [profile?.id]);

  const loadDashboardData = async () => {
    try {
      if (!profile?.id) {
        console.log('Profile not loaded yet');
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: stats } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .maybeSingle();

      const { data: meals } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', profile.id)
        .order('eaten_at', { ascending: false })
        .limit(3);

      setDailyStats(stats || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
      setRecentMeals(meals || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const calorieProgress = dailyStats && profile.daily_calorie_goal
    ? (dailyStats.total_calories / profile.daily_calorie_goal) * 100
    : 0;

  return (
    <PageContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <ImageBackground
          source={headerImage}
          style={styles.header}
          imageStyle={styles.headerImageStyle}
          resizeMode="cover"
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Hey, {profile?.full_name?.split(' ')[0] || 'there'}! 👋</Text>
              <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar user={profile} size={50} showBorder={true} borderColor="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <Card style={styles.calorieCard}>
            <View style={styles.calorieHeader}>
              <View>
                <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>
                  Today's Intake
                </Text>
                <Text style={[styles.calorieValue, { color: colors.text }]}>
                  {dailyStats?.total_calories || 0} / {profile?.daily_calorie_goal || 2000}
                </Text>
              </View>
              <Ionicons name="flame" size={40} color={colors.primary} />
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(calorieProgress, 100)}%`,
                    backgroundColor: calorieProgress > 100 ? colors.warning : colors.success,
                  },
                ]}
              />
            </View>
          </Card>

          <View style={styles.macrosContainer}>
            {[
              { label: 'Protein', value: dailyStats?.total_protein || 0, unit: 'g', icon: 'barbell', color: '#FF6B6B' },
              { label: 'Carbs', value: dailyStats?.total_carbs || 0, unit: 'g', icon: 'fast-food', color: '#4ECDC4' },
              { label: 'Fat', value: dailyStats?.total_fat || 0, unit: 'g', icon: 'water', color: '#FFD93D' },
            ].map((macro, index) => (
              <Card key={index} style={styles.macroCard}>
                <Ionicons name={macro.icon} size={24} color={macro.color} />
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {Math.round(macro.value)}{macro.unit}
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  {macro.label}
                </Text>
              </Card>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { 
                  backgroundColor: colors.primary,
                  ...Theme.getShadows(isDark).sm,
                }]}
                onPress={() => navigation.navigate('Camera')}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={28} color="#FFFFFF" />
                <Text style={styles.actionText}>Log Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { 
                  backgroundColor: colors.secondary,
                  ...Theme.getShadows(isDark).sm,
                }]}
                onPress={() => navigation.navigate('Diet')}
                activeOpacity={0.85}
              >
                <Ionicons name="restaurant" size={28} color="#FFFFFF" />
                <Text style={styles.actionText}>Diet Plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {recentMeals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Recent Meals</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Diary')}>
                  <Text style={[styles.sectionLink, { color: colors.primary }]}>View All</Text>
                </TouchableOpacity>
              </View>
              {recentMeals.map((meal, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedMeal(meal);
                    setMealModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Card style={styles.mealCard}>
                    <View style={styles.mealHeader}>
                      <Text style={[styles.mealName, { color: colors.text }]}>
                        {meal.meal_name}
                      </Text>
                      <View style={styles.mealHeaderRight}>
                        <Text style={[styles.mealCalories, { color: colors.primary }]}>
                          {meal.calories} cal
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                      </View>
                    </View>
                    <Text style={[styles.mealTime, { color: colors.textSecondary }]}>
                      {format(new Date(meal.eaten_at), 'h:mm a')}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <MealDetailModal
        visible={mealModalVisible}
        meal={selectedMeal}
        onClose={() => {
          setMealModalVisible(false);
          setSelectedMeal(null);
        }}
      />
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Theme.spacing.xxl + 40,
    paddingBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomLeftRadius: Theme.borderRadius.xl * 2,
    borderBottomRightRadius: Theme.borderRadius.xl * 2,
    overflow: 'hidden',
  },
  headerImageStyle: {
    borderBottomLeftRadius: Theme.borderRadius.xl * 2,
    borderBottomRightRadius: Theme.borderRadius.xl * 2,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  date: {
    fontSize: Theme.fontSize.base,
    color: '#FFFFFF',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  calorieCard: {
    marginBottom: Theme.spacing.lg,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  calorieLabel: {
    fontSize: Theme.fontSize.sm,
    marginBottom: Theme.spacing.xs,
  },
  calorieValue: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.sm,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  macroValue: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginTop: Theme.spacing.xs,
  },
  macroLabel: {
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  sectionLink: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  mealCard: {
    marginBottom: Theme.spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  mealName: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    flex: 1,
  },
  mealCalories: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.bold,
  },
  mealTime: {
    fontSize: Theme.fontSize.sm,
  },
});