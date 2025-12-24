import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/Card';
import { MealDetailModal } from '../components/MealDetailModal';
import { supabase } from '../services/supabase';
import { Theme } from '../constants/Theme';
import { format } from 'date-fns';
import { PageContainer } from '../components/PageContainer';

export const DiaryScreen = ({ navigation }) => {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealModalVisible, setMealModalVisible] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', profile.id)
        .order('eaten_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Oops!', 'We couldn\'t load your food diary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const deleteEntry = async (id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get the entry first to subtract from daily_stats
              const { data: entry } = await supabase
                .from('food_entries')
                .select('*')
                .eq('id', id)
                .single();

              if (!entry) {
                Alert.alert('Error', 'Entry not found');
                return;
              }

              // Delete the entry
              const { error } = await supabase
                .from('food_entries')
                .delete()
                .eq('id', id);

              if (error) throw error;

              // Update daily_stats
              const entryDate = format(new Date(entry.eaten_at), 'yyyy-MM-dd');
              const { data: currentStats } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('user_id', profile.id)
                .eq('date', entryDate)
                .maybeSingle();

              if (currentStats) {
                const newCalories = Math.max(0, (parseFloat(currentStats.total_calories) || 0) - parseFloat(entry.calories || 0));
                const newProtein = Math.max(0, (parseFloat(currentStats.total_protein) || 0) - parseFloat(entry.protein || 0));
                const newCarbs = Math.max(0, (parseFloat(currentStats.total_carbs) || 0) - parseFloat(entry.carbs || 0));
                const newFat = Math.max(0, (parseFloat(currentStats.total_fat) || 0) - parseFloat(entry.fat || 0));

                await supabase
                  .from('daily_stats')
                  .update({
                    total_calories: newCalories,
                    total_protein: newProtein,
                    total_carbs: newCarbs,
                    total_fat: newFat,
                  })
                  .eq('id', currentStats.id);
              }

              setEntries(prev => prev.filter(entry => entry.id !== id));
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Oops!', 'We couldn\'t delete this entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderEntry = ({ item }) => (
    <Card style={styles.entryCard}>
      <TouchableOpacity
        onPress={() => {
          setSelectedMeal(item);
          setMealModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        {item.image_url && (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.mealImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={[styles.mealName, { color: colors.text }]}>
              {item.meal_name}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {format(new Date(item.eaten_at), 'MMM d, yyyy • h:mm a')}
            </Text>
          </View>
          <View style={styles.entryActions}>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                deleteEntry(item.id);
              }}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.nutrients}>
        <View style={styles.nutrientItem}>
          <Ionicons name="flame" size={16} color={colors.primary} />
          <Text style={[styles.nutrientText, { color: colors.text }]}>
            {item.calories} cal
          </Text>
        </View>
        <View style={styles.nutrientItem}>
          <Ionicons name="barbell" size={16} color="#FF6B6B" />
          <Text style={[styles.nutrientText, { color: colors.text }]}>
            {Math.round(item.protein)}g protein
          </Text>
        </View>
        <View style={styles.nutrientItem}>
          <Ionicons name="fast-food" size={16} color="#4ECDC4" />
          <Text style={[styles.nutrientText, { color: colors.text }]}>
            {Math.round(item.carbs)}g carbs
          </Text>
        </View>
        <View style={styles.nutrientItem}>
          <Ionicons name="water" size={16} color="#FFD93D" />
          <Text style={[styles.nutrientText, { color: colors.text }]}>
            {Math.round(item.fat)}g fat
          </Text>
        </View>
      </View>

      {item.health_score && (
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
            Health Score:
          </Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>
            {item.health_score}/100
          </Text>
        </View>
      )}
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        Your food diary is empty
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Capture your meals and let AI analyze them for you
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { 
          backgroundColor: colors.primary,
          ...Theme.getShadows(isDark).sm,
        }]}
        onPress={() => navigation.navigate('Camera')}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Capture Your First Meal</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <PageContainer>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          entries.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      />
      
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
  list: {
    padding: Theme.spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  entryCard: {
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 200,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  deleteButton: {
    padding: Theme.spacing.xs,
  },
  entryInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
  },
  timestamp: {
    fontSize: Theme.fontSize.sm,
  },
  nutrients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  nutrientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  nutrientText: {
    fontSize: Theme.fontSize.sm,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  scoreLabel: {
    fontSize: Theme.fontSize.sm,
    marginRight: Theme.spacing.xs,
  },
  scoreValue: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg, // 12px - elegant rounded corners
    minHeight: 48, // Proper touch target
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    letterSpacing: 0.2,
  },
});