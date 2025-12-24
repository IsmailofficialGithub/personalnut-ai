import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Avatar } from '../components/Avatar';
import { AvatarSelectionModal } from '../components/AvatarSelectionModal';
import { supabase } from '../services/supabase';
import { Theme } from '../constants/Theme';
import { PageContainer } from '../components/PageContainer';

export const ProfileScreen = ({ navigation }) => {
  const { user, profile, signOut, updateProfile, fetchProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState('week'); // 'day', 'week', 'month', 'year'
  const [periodStats, setPeriodStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  // Use local asset for header image
  const headerImage = require('../../assets/header-1.png');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    age: profile?.age?.toString() || '',
    weight: profile?.weight?.toString() || '',
    height: profile?.height?.toString() || '',
    weight_goal: profile?.weight_goal?.toString() || '',
  });

  useEffect(() => {
    if (profile?.id) {
      loadPeriodStats();
    }
  }, [statsPeriod, profile?.id]);

  const loadPeriodStats = async () => {
    setLoadingStats(true);
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (statsPeriod) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { data: entries } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', profile.id)
        .gte('eaten_at', startDate.toISOString())
        .lte('eaten_at', now.toISOString());

      if (entries) {
        const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
        const totalProtein = entries.reduce((sum, e) => sum + (e.protein || 0), 0);
        const totalCarbs = entries.reduce((sum, e) => sum + (e.carbs || 0), 0);
        const totalFat = entries.reduce((sum, e) => sum + (e.fat || 0), 0);
        const avgHealthScore = entries.length > 0
          ? entries.reduce((sum, e) => sum + (e.health_score || 0), 0) / entries.length
          : 0;

        setPeriodStats({
          totalCalories: Math.round(totalCalories),
          totalProtein: Math.round(totalProtein),
          totalCarbs: Math.round(totalCarbs),
          totalFat: Math.round(totalFat),
          avgHealthScore: Math.round(avgHealthScore),
          mealCount: entries.length,
        });
      }
    } catch (error) {
      console.error('Error loading period stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!formData.full_name?.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await updateProfile({
        full_name: formData.full_name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight_goal: formData.weight_goal ? parseFloat(formData.weight_goal) : null,
      });

      if (error) {
        console.error('Profile update error:', error);
        const errorMessage = error.message || 'Failed to update profile. Please try again.';
        Alert.alert('Error', errorMessage);
      } else {
        setEditing(false);
        // Refresh profile data
        if (user?.id) {
          await fetchProfile(user.id);
        }
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Unexpected error saving profile:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const calculateBMI = () => {
    if (profile?.weight && profile?.height) {
      const heightInMeters = profile.height / 100;
      const bmi = profile.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  const getBMICategory = (bmi) => {
    if (bmi === 'N/A') return 'N/A';
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  };

  const handleAvatarSelect = async (avatar) => {
    try {
      setLoading(true);
      const { error: updateError } = await updateProfile({
        avatar_url: avatar.url,
      });

      if (updateError) throw updateError;

      await fetchProfile(user.id);
      Alert.alert('Success', 'Avatar updated!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={headerImage}
          style={styles.header}
          imageStyle={styles.headerImageStyle}
          resizeMode="cover"
        >
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => setShowAvatarModal(true)}
              disabled={loading}
              style={styles.avatarWrapper}
            >
              {loading ? (
                <View style={[styles.avatar, styles.avatarLoading]}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : (
                <Avatar user={profile} size={100} showBorder={true} borderColor="#FFFFFF" />
              )}
              <View style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {!editing ? (
            <>
              <Card style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Health Stats
                  </Text>
                  <View style={styles.periodSelector}>
                    {['day', 'week', 'month', 'year'].map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.periodButton,
                          {
                            backgroundColor: statsPeriod === period ? colors.primary : colors.surface,
                          },
                        ]}
                        onPress={() => setStatsPeriod(period)}
                      >
                        <Text
                          style={[
                            styles.periodButtonText,
                            {
                              color: statsPeriod === period ? '#FFFFFF' : colors.text,
                              fontWeight: statsPeriod === period ? Theme.fontWeight.semibold : Theme.fontWeight.normal,
                            },
                          ]}
                        >
                          {period === 'day' ? '1D' : period === 'week' ? '1W' : period === 'month' ? '1M' : '1Y'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {loadingStats ? (
                  <View style={styles.loadingStats}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : periodStats ? (
                  <View style={styles.periodStatsContainer}>
                    <View style={styles.periodStatRow}>
                      <View style={styles.periodStatItem}>
                        <Ionicons name="flame" size={20} color="#FF6B6B" />
                        <Text style={[styles.periodStatValue, { color: colors.text }]}>
                          {periodStats.totalCalories}
                        </Text>
                        <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>
                          Calories
                        </Text>
                      </View>
                      <View style={styles.periodStatItem}>
                        <Ionicons name="restaurant" size={20} color={colors.primary} />
                        <Text style={[styles.periodStatValue, { color: colors.text }]}>
                          {periodStats.mealCount}
                        </Text>
                        <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>
                          Meals
                        </Text>
                      </View>
                      <View style={styles.periodStatItem}>
                        <Ionicons name="star" size={20} color="#FFD93D" />
                        <Text style={[styles.periodStatValue, { color: colors.text }]}>
                          {periodStats.avgHealthScore}
                        </Text>
                        <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>
                          Avg Score
                        </Text>
                      </View>
                    </View>
                    <View style={styles.periodStatRow}>
                      <View style={styles.periodStatItem}>
                        <Ionicons name="barbell" size={20} color="#4ECDC4" />
                        <Text style={[styles.periodStatValue, { color: colors.text }]}>
                          {periodStats.totalProtein}g
                        </Text>
                        <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>
                          Protein
                        </Text>
                      </View>
                      <View style={styles.periodStatItem}>
                        <Ionicons name="fast-food" size={20} color="#FFD93D" />
                        <Text style={[styles.periodStatValue, { color: colors.text }]}>
                          {periodStats.totalCarbs}g
                        </Text>
                        <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>
                          Carbs
                        </Text>
                      </View>
                      <View style={styles.periodStatItem}>
                        <Ionicons name="water" size={20} color="#95E1D3" />
                        <Text style={[styles.periodStatValue, { color: colors.text }]}>
                          {periodStats.totalFat}g
                        </Text>
                        <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>
                          Fat
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="fitness" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {profile?.weight || 'N/A'} kg
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Current Weight
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={24} color={colors.accent} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {profile?.weight_goal || 'N/A'} kg
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Goal Weight
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="resize" size={24} color={colors.secondary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {profile?.height || 'N/A'} cm
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Height
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="analytics" size={24} color={colors.info} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {calculateBMI()}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      BMI ({getBMICategory(calculateBMI())})
                    </Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.infoCard}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Personal Information
                </Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Age
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile?.age || 'N/A'} years
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Gender
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile?.gender?.charAt(0).toUpperCase() + profile?.gender?.slice(1) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Activity Level
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile?.activity_level?.replace('_', ' ').charAt(0).toUpperCase() + 
                     profile?.activity_level?.slice(1).replace('_', ' ') || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Daily Calorie Goal
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile?.daily_calorie_goal || 'N/A'} cal
                  </Text>
                </View>
              </Card>

              {profile?.dietary_preferences && profile.dietary_preferences.length > 0 && (
                <Card style={styles.preferencesCard}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Dietary Preferences
                  </Text>
                  <View style={styles.tagsContainer}>
                    {profile.dietary_preferences.map((pref, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>
                          {pref.charAt(0).toUpperCase() + pref.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}

              <Card style={styles.settingsCard}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Settings
                </Text>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="moon" size={24} color={colors.text} />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Dark Mode
                    </Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </Card>

              <View style={styles.actionButtons}>
                <Button
                  title="Edit Profile"
                  variant="outline"
                  onPress={() => setEditing(true)}
                  icon={<Ionicons name="create-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />}
                  style={styles.actionButton}
                />
                <Button
                  title="Sign Out"
                  variant="outline"
                  onPress={handleSignOut}
                  icon={<Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />}
                  style={[styles.actionButton, { borderColor: colors.error }]}
                  textStyle={{ color: colors.error }}
                />
              </View>
            </>
          ) : (
            <Card style={styles.editCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Edit Profile
              </Text>

              <Input
                label="Full Name"
                value={formData.full_name}
                onChangeText={(v) => setFormData({ ...formData, full_name: v })}
                placeholder="Enter your full name"
                icon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
              />

              <Input
                label="Age"
                value={formData.age}
                onChangeText={(v) => setFormData({ ...formData, age: v })}
                placeholder="Enter your age"
                keyboardType="numeric"
                icon={<Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />}
              />

              <Input
                label="Current Weight (kg)"
                value={formData.weight}
                onChangeText={(v) => setFormData({ ...formData, weight: v })}
                placeholder="Enter your weight"
                keyboardType="decimal-pad"
                icon={<Ionicons name="fitness-outline" size={20} color={colors.textSecondary} />}
              />

              <Input
                label="Height (cm)"
                value={formData.height}
                onChangeText={(v) => setFormData({ ...formData, height: v })}
                placeholder="Enter your height"
                keyboardType="decimal-pad"
                icon={<Ionicons name="resize-outline" size={20} color={colors.textSecondary} />}
              />

              <Input
                label="Target Weight (kg)"
                value={formData.weight_goal}
                onChangeText={(v) => setFormData({ ...formData, weight_goal: v })}
                placeholder="Enter your goal weight"
                keyboardType="decimal-pad"
                icon={<Ionicons name="trophy-outline" size={20} color={colors.textSecondary} />}
              />

              <View style={styles.editButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setEditing(false)}
                  style={styles.editButton}
                />
                <Button
                  title="Save"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.editButton}
                />
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
      
      <AvatarSelectionModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelect={handleAvatarSelect}
        currentGender={profile?.gender || 'male'}
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
    paddingTop: 60,
    paddingBottom: Theme.spacing.xl,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLoading: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  email: {
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
  statsCard: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  statValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginTop: Theme.spacing.sm,
  },
  statLabel: {
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: Theme.fontSize.base,
  },
  infoValue: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium,
  },
  preferencesCard: {
    marginBottom: Theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  tag: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
  },
  tagText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
  },
  settingsCard: {
    marginBottom: Theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  settingLabel: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium,
  },
  actionButtons: {
    gap: Theme.spacing.sm,
  },
  actionButton: {
    marginBottom: Theme.spacing.sm,
  },
  editCard: {
    marginBottom: Theme.spacing.lg,
  },
  editButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  editButton: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  periodButton: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  periodButtonText: {
    fontSize: Theme.fontSize.sm,
  },
  loadingStats: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  periodStatsContainer: {
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  periodStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Theme.spacing.md,
  },
  periodStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  periodStatValue: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginTop: Theme.spacing.xs,
  },
  periodStatLabel: {
    fontSize: Theme.fontSize.xs,
    marginTop: Theme.spacing.xs,
  },
});