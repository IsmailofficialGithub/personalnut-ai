import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { analyzeFoodImage } from '../services/openai';
import { supabase } from '../services/supabase';
import { Theme } from '../constants/Theme';
import { format } from 'date-fns';

export const FoodAnalysisScreen = ({ route, navigation }) => {
  const { imageUri, base64 } = route.params;
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    analyzeFood();
  }, []);

  const analyzeFood = async () => {
    try {
      const result = await analyzeFoodImage(base64);
      setAnalysis(result);
    } catch (error) {
      Alert.alert('Error', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const saveFoodEntry = async () => {
    setSaving(true);
    try {
      let imageUrl = null;

      // Upload meal image to Supabase storage
      if (imageUri) {
        try {
          // Generate unique filename
          const fileExtension = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${profile.id}/${Date.now()}.${fileExtension}`;
          
          // Read file as base64
          let base64Data;
          if (base64) {
            // Use provided base64 (remove data URL prefix if present)
            base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
          } else {
            // Read from file system
            base64Data = await FileSystem.readAsStringAsync(imageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          
          // Convert base64 to binary string for upload
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Upload to Supabase storage using fetch API (works in React Native)
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No active session');
          }

          const fileExt = fileExtension === 'jpg' ? 'jpeg' : fileExtension;
          const contentType = `image/${fileExt}`;
          
          // Get Supabase URL from constants
          const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL || Constants.manifest?.extra?.SUPABASE_URL || '';
          
          // Use fetch to upload the file
          const uploadUrl = `${supabaseUrl}/storage/v1/object/meals/${fileName}`;
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': contentType,
              'x-upsert': 'false',
            },
            body: bytes,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Error uploading image:', errorText);
            // Continue without image if upload fails
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('meals')
              .getPublicUrl(fileName);
            
            imageUrl = urlData?.publicUrl || null;
          }
        } catch (uploadErr) {
          console.error('Error processing image upload:', uploadErr);
          // Continue without image if upload fails
        }
      }

      // Insert food entry with image URL and all nutritional data
      const { error: insertError } = await supabase.from('food_entries').insert({
        user_id: profile.id,
        meal_name: analysis.meal_name,
        meal_type: analysis.meal_type || 'meal',
        estimated_quantity: analysis.estimated_quantity,
        serving_size: analysis.serving_size,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
        saturated_fat: analysis.saturated_fat,
        trans_fat: analysis.trans_fat,
        monounsaturated_fat: analysis.monounsaturated_fat,
        polyunsaturated_fat: analysis.polyunsaturated_fat,
        cholesterol: analysis.cholesterol,
        fiber: analysis.fiber,
        sugar: analysis.sugar,
        added_sugar: analysis.added_sugar,
        sodium: analysis.sodium,
        potassium: analysis.potassium,
        calcium: analysis.calcium,
        iron: analysis.iron,
        magnesium: analysis.magnesium,
        phosphorus: analysis.phosphorus,
        zinc: analysis.zinc,
        vitamin_a: analysis.vitamin_a,
        vitamin_c: analysis.vitamin_c,
        vitamin_d: analysis.vitamin_d,
        vitamin_e: analysis.vitamin_e,
        vitamin_k: analysis.vitamin_k,
        thiamin: analysis.thiamin,
        riboflavin: analysis.riboflavin,
        niacin: analysis.niacin,
        vitamin_b6: analysis.vitamin_b6,
        folate: analysis.folate,
        vitamin_b12: analysis.vitamin_b12,
        vitamins: analysis.vitamins,
        minerals: analysis.minerals,
        cuisine_type: analysis.cuisine_type,
        cooking_method: analysis.cooking_method,
        main_ingredients: analysis.main_ingredients,
        allergens: analysis.allergens,
        dietary_tags: analysis.dietary_tags,
        best_for: analysis.best_for,
        not_recommended_for: analysis.not_recommended_for,
        health_benefits: analysis.health_benefits,
        analysis: analysis.analysis,
        recommendations: analysis.recommendations,
        health_score: analysis.health_score,
        image_url: imageUrl,
        eaten_at: new Date(),
      });

      if (insertError) throw insertError;

      // Update or insert daily_stats for today
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get current daily stats
      const { data: currentStats } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .maybeSingle();

      if (currentStats) {
        // Update existing stats
        const { error: updateError } = await supabase
          .from('daily_stats')
          .update({
            total_calories: (parseFloat(currentStats.total_calories) || 0) + parseFloat(analysis.calories),
            total_protein: (parseFloat(currentStats.total_protein) || 0) + parseFloat(analysis.protein),
            total_carbs: (parseFloat(currentStats.total_carbs) || 0) + parseFloat(analysis.carbs),
            total_fat: (parseFloat(currentStats.total_fat) || 0) + parseFloat(analysis.fat),
          })
          .eq('id', currentStats.id);

        if (updateError) throw updateError;
      } else {
        // Insert new stats
        const { error: insertStatsError } = await supabase
          .from('daily_stats')
          .insert({
            user_id: profile.id,
            date: today,
            total_calories: parseFloat(analysis.calories),
            total_protein: parseFloat(analysis.protein),
            total_carbs: parseFloat(analysis.carbs),
            total_fat: parseFloat(analysis.fat),
          });

        if (insertStatsError) throw insertStatsError;
      }

      Alert.alert('✨ Meal Saved!', 'Your meal has been added to your diary', [
        { text: 'Great!', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      console.error('Error saving food entry:', error);
      Alert.alert('Oops!', 'We couldn\'t save your meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Analyzing your meal...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        <Card style={styles.card}>
          <Text style={[styles.mealName, { color: colors.text }]}>
            {analysis.meal_name}
          </Text>
          {analysis.estimated_quantity && (
            <View style={styles.quantityContainer}>
              <Ionicons name="scale-outline" size={18} color={colors.primary} />
              <Text style={[styles.quantityText, { color: colors.textSecondary }]}>
                Estimated Quantity: {analysis.estimated_quantity}
              </Text>
            </View>
          )}
          {analysis.serving_size && (
            <View style={styles.quantityContainer}>
              <Ionicons name="restaurant-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.quantityText, { color: colors.textSecondary }]}>
                Serving Size: {analysis.serving_size}
              </Text>
            </View>
          )}
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              Health Score
            </Text>
            <Text style={[styles.scoreValue, { color: colors.primary }]}>
              {analysis.health_score}/100
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Nutrition Facts
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: colors.text }]}>Macronutrients</Text>
          {[
            { label: 'Calories', value: analysis.calories, unit: 'kcal', icon: 'flame' },
            { label: 'Protein', value: analysis.protein, unit: 'g', icon: 'barbell' },
            { label: 'Carbs', value: analysis.carbs, unit: 'g', icon: 'fast-food' },
            { label: 'Total Fat', value: analysis.fat, unit: 'g', icon: 'water' },
            analysis.saturated_fat && { label: 'Saturated Fat', value: analysis.saturated_fat, unit: 'g', icon: 'remove-circle' },
            analysis.trans_fat && { label: 'Trans Fat', value: analysis.trans_fat, unit: 'g', icon: 'warning' },
            analysis.cholesterol && { label: 'Cholesterol', value: analysis.cholesterol, unit: 'mg', icon: 'heart' },
            { label: 'Fiber', value: analysis.fiber, unit: 'g', icon: 'leaf' },
            { label: 'Sugar', value: analysis.sugar, unit: 'g', icon: 'cube' },
            analysis.added_sugar && { label: 'Added Sugar', value: analysis.added_sugar, unit: 'g', icon: 'cube-outline' },
            { label: 'Sodium', value: analysis.sodium, unit: 'mg', icon: 'water-outline' },
          ].filter(Boolean).map((item, index) => (
            <View key={index} style={styles.nutrientRow}>
              <View style={styles.nutrientLeft}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={[styles.nutrientLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {Math.round(item.value || 0)}{item.unit}
              </Text>
            </View>
          ))}

          {(analysis.potassium || analysis.calcium || analysis.iron || analysis.magnesium || analysis.phosphorus || analysis.zinc) && (
            <>
              <Text style={[styles.subsectionTitle, { color: colors.text, marginTop: Theme.spacing.md }]}>Minerals</Text>
              {[
                analysis.potassium && { label: 'Potassium', value: analysis.potassium, unit: 'mg', icon: 'flash' },
                analysis.calcium && { label: 'Calcium', value: analysis.calcium, unit: 'mg', icon: 'cube' },
                analysis.iron && { label: 'Iron', value: analysis.iron, unit: 'mg', icon: 'magnet' },
                analysis.magnesium && { label: 'Magnesium', value: analysis.magnesium, unit: 'mg', icon: 'diamond' },
                analysis.phosphorus && { label: 'Phosphorus', value: analysis.phosphorus, unit: 'mg', icon: 'nuclear' },
                analysis.zinc && { label: 'Zinc', value: analysis.zinc, unit: 'mg', icon: 'shield' },
              ].filter(Boolean).map((item, index) => (
                <View key={index} style={styles.nutrientRow}>
                  <View style={styles.nutrientLeft}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <Text style={[styles.nutrientLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {Math.round(item.value || 0)}{item.unit}
                  </Text>
                </View>
              ))}
            </>
          )}

          {(analysis.vitamin_a || analysis.vitamin_c || analysis.vitamin_d || analysis.vitamin_e || analysis.vitamin_k || analysis.thiamin || analysis.riboflavin || analysis.niacin || analysis.vitamin_b6 || analysis.folate || analysis.vitamin_b12) && (
            <>
              <Text style={[styles.subsectionTitle, { color: colors.text, marginTop: Theme.spacing.md }]}>Vitamins</Text>
              {[
                analysis.vitamin_a && { label: 'Vitamin A', value: analysis.vitamin_a, unit: '', icon: 'eye' },
                analysis.vitamin_c && { label: 'Vitamin C', value: analysis.vitamin_c, unit: 'mg', icon: 'sunny' },
                analysis.vitamin_d && { label: 'Vitamin D', value: analysis.vitamin_d, unit: '', icon: 'sunny-outline' },
                analysis.vitamin_e && { label: 'Vitamin E', value: analysis.vitamin_e, unit: '', icon: 'leaf-outline' },
                analysis.vitamin_k && { label: 'Vitamin K', value: analysis.vitamin_k, unit: 'mcg', icon: 'medical' },
                analysis.thiamin && { label: 'Thiamin (B1)', value: analysis.thiamin, unit: 'mg', icon: 'flask' },
                analysis.riboflavin && { label: 'Riboflavin (B2)', value: analysis.riboflavin, unit: 'mg', icon: 'flask-outline' },
                analysis.niacin && { label: 'Niacin (B3)', value: analysis.niacin, unit: 'mg', icon: 'flask' },
                analysis.vitamin_b6 && { label: 'Vitamin B6', value: analysis.vitamin_b6, unit: 'mg', icon: 'flask' },
                analysis.folate && { label: 'Folate', value: analysis.folate, unit: 'mcg', icon: 'flower' },
                analysis.vitamin_b12 && { label: 'Vitamin B12', value: analysis.vitamin_b12, unit: 'mcg', icon: 'flask' },
              ].filter(Boolean).map((item, index) => (
                <View key={index} style={styles.nutrientRow}>
                  <View style={styles.nutrientLeft}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <Text style={[styles.nutrientLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {typeof item.value === 'number' ? Math.round(item.value) : item.value}{item.unit}
                  </Text>
                </View>
              ))}
            </>
          )}
        </Card>

        {(analysis.main_ingredients || analysis.cuisine_type || analysis.cooking_method || analysis.meal_type) && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Meal Details
            </Text>
            {analysis.meal_type && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Meal Type: </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{analysis.meal_type}</Text>
              </View>
            )}
            {analysis.cuisine_type && (
              <View style={styles.detailRow}>
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cuisine: </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{analysis.cuisine_type}</Text>
              </View>
            )}
            {analysis.cooking_method && (
              <View style={styles.detailRow}>
                <Ionicons name="flame-outline" size={18} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cooking Method: </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{analysis.cooking_method}</Text>
              </View>
            )}
            {analysis.main_ingredients && analysis.main_ingredients.length > 0 && (
              <View style={styles.ingredientsContainer}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: Theme.spacing.xs }]}>Main Ingredients:</Text>
                <View style={styles.ingredientsList}>
                  {analysis.main_ingredients.map((ingredient, idx) => (
                    <View key={idx} style={[styles.ingredientTag, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.ingredientText, { color: colors.primary }]}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {analysis.allergens && analysis.allergens.length > 0 && (
              <View style={styles.allergensContainer}>
                <Text style={[styles.detailLabel, { color: colors.error, marginBottom: Theme.spacing.xs }]}>⚠️ Allergens:</Text>
                <View style={styles.ingredientsList}>
                  {analysis.allergens.map((allergen, idx) => (
                    <View key={idx} style={[styles.ingredientTag, { backgroundColor: colors.error + '15' }]}>
                      <Text style={[styles.ingredientText, { color: colors.error }]}>{allergen}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {analysis.dietary_tags && analysis.dietary_tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <View style={styles.ingredientsList}>
                  {analysis.dietary_tags.map((tag, idx) => (
                    <View key={idx} style={[styles.ingredientTag, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.ingredientText, { color: colors.text }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Nutrition Insights
          </Text>
          <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
            {analysis.analysis}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Expert Tips
          </Text>
          <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
            {analysis.recommendations}
          </Text>
        </Card>

        {analysis.best_for && (
          <Card style={styles.card}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                Best For
              </Text>
            </View>
            
            {analysis.best_for.person_types && analysis.best_for.person_types.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Person Types:</Text>
                <View style={styles.tagsContainer}>
                  {analysis.best_for.person_types.map((type, idx) => (
                    <View key={idx} style={[styles.recommendationTag, { backgroundColor: colors.success + '15' }]}>
                      <Text style={[styles.recommendationTagText, { color: colors.success || colors.primary }]}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {analysis.best_for.health_conditions && analysis.best_for.health_conditions.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Health Conditions:</Text>
                <View style={styles.tagsContainer}>
                  {analysis.best_for.health_conditions.map((condition, idx) => (
                    <View key={idx} style={[styles.recommendationTag, { backgroundColor: colors.info + '15' }]}>
                      <Text style={[styles.recommendationTagText, { color: colors.info || colors.primary }]}>{condition}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {analysis.best_for.patient_types && analysis.best_for.patient_types.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Patient Types:</Text>
                <View style={styles.tagsContainer}>
                  {analysis.best_for.patient_types.map((type, idx) => (
                    <View key={idx} style={[styles.recommendationTag, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.recommendationTagText, { color: colors.primary }]}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {analysis.best_for.lifestyle && analysis.best_for.lifestyle.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Lifestyle:</Text>
                <View style={styles.tagsContainer}>
                  {analysis.best_for.lifestyle.map((lifestyle, idx) => (
                    <View key={idx} style={[styles.recommendationTag, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.recommendationTagText, { color: colors.text }]}>{lifestyle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {analysis.health_benefits && analysis.health_benefits.length > 0 && (
          <Card style={[styles.card, { backgroundColor: colors.success + '08' }]}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="heart" size={24} color={colors.success || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                Health Benefits
              </Text>
            </View>
            {analysis.health_benefits.map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
                <Ionicons name="checkmark" size={16} color={colors.success || colors.primary} />
                <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </Card>
        )}

        {analysis.not_recommended_for && (
          <Card style={[styles.card, { backgroundColor: colors.error + '08' }]}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="warning" size={24} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.error, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                Not Recommended For
              </Text>
            </View>
            
            {analysis.not_recommended_for.person_types && analysis.not_recommended_for.person_types.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Person Types:</Text>
                <View style={styles.tagsContainer}>
                  {analysis.not_recommended_for.person_types.map((type, idx) => (
                    <View key={idx} style={[styles.recommendationTag, { backgroundColor: colors.error + '15' }]}>
                      <Text style={[styles.recommendationTagText, { color: colors.error }]}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {analysis.not_recommended_for.health_conditions && analysis.not_recommended_for.health_conditions.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Health Conditions:</Text>
                <View style={styles.tagsContainer}>
                  {analysis.not_recommended_for.health_conditions.map((condition, idx) => (
                    <View key={idx} style={[styles.recommendationTag, { backgroundColor: colors.error + '15' }]}>
                      <Text style={[styles.recommendationTagText, { color: colors.error }]}>{condition}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {analysis.not_recommended_for.patient_types && analysis.not_recommended_for.patient_types.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Patient Types:</Text>
                <View style={styles.tagsContainer}>
                  {analysis.not_recommended_for.patient_types.map((type, idx) => (
                    <View key={idx} style={[styles.recommendationTag, { backgroundColor: colors.error + '15' }]}>
                      <Text style={[styles.recommendationTagText, { color: colors.error }]}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {analysis.warnings && analysis.warnings.length > 0 && (
          <Card style={[styles.card, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>
              Warnings
            </Text>
            {analysis.warnings.map((warning, index) => (
              <Text key={index} style={[styles.warningText, { color: colors.error }]}>
                • {warning}
              </Text>
            ))}
          </Card>
        )}

        <View style={styles.buttons}>
          <Button
            title="Save to Diary"
            onPress={saveFoodEntry}
            loading={saving}
            style={styles.button}
          />
          <Button
            title="Take Another Photo"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </View>
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
  loadingText: {
    fontSize: Theme.fontSize.base,
    marginTop: Theme.spacing.md,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  mealName: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  scoreLabel: {
    fontSize: Theme.fontSize.base,
  },
  scoreValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  nutrientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  nutrientLabel: {
    fontSize: Theme.fontSize.base,
  },
  nutrientValue: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  analysisText: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
  },
  warningText: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
    marginBottom: Theme.spacing.xs,
  },
  buttons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  button: {
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  quantityText: {
    fontSize: Theme.fontSize.sm,
  },
  subsectionTitle: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  detailLabel: {
    fontSize: Theme.fontSize.sm,
  },
  detailValue: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
  },
  ingredientsContainer: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  allergensContainer: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  tagsContainer: {
    marginTop: Theme.spacing.sm,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
  },
  ingredientTag: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  ingredientText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  recommendationSection: {
    marginBottom: Theme.spacing.md,
  },
  recommendationSubtitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
  },
  recommendationTag: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  recommendationTagText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: Theme.fontSize.base,
    lineHeight: 20,
  },
});