import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from './Card';
import { Theme } from '../constants/Theme';
import { format } from 'date-fns';

export const MealDetailModal = ({ visible, meal, onClose }) => {
  const { colors } = useTheme();

  if (!meal) return null;

  // Parse analysis to extract recipe information
  const parseRecipeInfo = (analysis) => {
    if (!analysis) return { ingredients: [], steps: [], notes: null };
    
    const ingredients = [];
    const steps = [];
    let notes = null;
    
    // Try to extract ingredients (look for patterns like "Ingredients:", "Ingredients list:", etc.)
    const ingredientMatch = analysis.match(/(?:ingredients?|items?)[:\-]?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:instructions?|steps?|method|preparation|directions?|recipe|how to|$))/i);
    if (ingredientMatch) {
      const ingredientText = ingredientMatch[1];
      ingredientText.split(/[,\n•\-\*]/).forEach(item => {
        const trimmed = item.trim();
        if (trimmed && trimmed.length > 2) {
          ingredients.push(trimmed);
        }
      });
    }
    
    // Try to extract steps (look for numbered steps, "Step", "Instructions", etc.)
    const stepsMatch = analysis.match(/(?:instructions?|steps?|method|preparation|directions?|recipe|how to)[:\-]?\s*([^\n]+(?:\n[^\n]+)*)/i);
    if (stepsMatch) {
      const stepsText = stepsMatch[1];
      // Split by numbered steps or bullet points
      stepsText.split(/\n(?=\d+[\.\)]\s*|\-\s*|\*\s*)/).forEach(step => {
        const trimmed = step.replace(/^\d+[\.\)]\s*/, '').replace(/^[\-\*]\s*/, '').trim();
        if (trimmed && trimmed.length > 5) {
          steps.push(trimmed);
        }
      });
    }
    
    // If no structured data found, use the whole analysis as notes
    if (ingredients.length === 0 && steps.length === 0) {
      notes = analysis;
    }
    
    return { ingredients, steps, notes };
  };

  const recipeInfo = parseRecipeInfo(meal.analysis);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Meal Information</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {meal.image_url && (
              <Image source={{ uri: meal.image_url }} style={styles.mealImage} />
            )}

            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="restaurant" size={24} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dish</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {meal.meal_name || 'Unnamed Meal'}
                  </Text>
                </View>
              </View>

              {meal.estimated_quantity && (
                <View style={styles.infoRow}>
                  <Ionicons name="scale-outline" size={24} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Portion Size</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {meal.estimated_quantity}
                    </Text>
                  </View>
                </View>
              )}

              {meal.serving_size && (
                <View style={styles.infoRow}>
                  <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Standard Serving</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {meal.serving_size}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <Ionicons name="time" size={24} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Time</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {format(new Date(meal.eaten_at || meal.created_at), 'MMM d, yyyy • h:mm a')}
                  </Text>
                </View>
              </View>

              {meal.health_score && (
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={24} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Health Score</Text>
                    <Text style={[styles.infoValue, { color: colors.primary }]}>
                      {meal.health_score}/100
                    </Text>
                  </View>
                </View>
              )}

              {(meal.cuisine_type || meal.cooking_method || meal.meal_type) && (
                <>
                  {meal.meal_type && (
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={24} color={colors.primary} />
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Meal Type</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {meal.meal_type}
                        </Text>
                      </View>
                    </View>
                  )}
                  {meal.cuisine_type && (
                    <View style={styles.infoRow}>
                      <Ionicons name="globe-outline" size={24} color={colors.primary} />
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Cuisine</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {meal.cuisine_type}
                        </Text>
                      </View>
                    </View>
                  )}
                  {meal.cooking_method && (
                    <View style={styles.infoRow}>
                      <Ionicons name="flame-outline" size={24} color={colors.primary} />
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Cooking Method</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {meal.cooking_method}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </Card>

            <Card style={styles.nutrientsCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrition Facts</Text>
              
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>Macronutrients</Text>
              <View style={styles.nutrientGrid}>
                <View style={[styles.nutrientItem, { backgroundColor: colors.surface }]}>
                  <Ionicons name="flame" size={28} color="#FF6B6B" />
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {Math.round(meal.calories || 0)}
                  </Text>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Calories</Text>
                </View>

                <View style={[styles.nutrientItem, { backgroundColor: colors.surface }]}>
                  <Ionicons name="barbell" size={28} color="#4ECDC4" />
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {`${Math.round(meal.protein || 0)}g`}
                  </Text>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Protein</Text>
                </View>

                <View style={[styles.nutrientItem, { backgroundColor: colors.surface }]}>
                  <Ionicons name="fast-food" size={28} color="#FFD93D" />
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {`${Math.round(meal.carbs || 0)}g`}
                  </Text>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Carbs</Text>
                </View>

                <View style={[styles.nutrientItem, { backgroundColor: colors.surface }]}>
                  <Ionicons name="water" size={28} color="#95E1D3" />
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {`${Math.round(meal.fat || 0)}g`}
                  </Text>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Fat</Text>
                </View>
              </View>

              <View style={styles.additionalNutrients}>
                {meal.fiber && (
                  <View style={styles.additionalNutrient}>
                    <Ionicons name="leaf" size={20} color={colors.primary} />
                    <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                      {`Fiber: ${Math.round(meal.fiber)}g`}
                    </Text>
                  </View>
                )}
                {meal.sugar && (
                  <View style={styles.additionalNutrient}>
                    <Ionicons name="cube" size={20} color={colors.primary} />
                    <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                      {`Sugar: ${Math.round(meal.sugar)}g`}
                    </Text>
                  </View>
                )}
                {meal.added_sugar && (
                  <View style={styles.additionalNutrient}>
                    <Ionicons name="cube-outline" size={20} color={colors.primary} />
                    <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                      {`Added Sugar: ${Math.round(meal.added_sugar)}g`}
                    </Text>
                  </View>
                )}
                {meal.sodium && (
                  <View style={styles.additionalNutrient}>
                    <Ionicons name="water-outline" size={20} color={colors.primary} />
                    <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                      {`Sodium: ${Math.round(meal.sodium)}mg`}
                    </Text>
                  </View>
                )}
                {meal.saturated_fat && (
                  <View style={styles.additionalNutrient}>
                    <Ionicons name="remove-circle" size={20} color={colors.primary} />
                    <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                      {`Saturated Fat: ${Math.round(meal.saturated_fat)}g`}
                    </Text>
                  </View>
                )}
                {meal.trans_fat && (
                  <View style={styles.additionalNutrient}>
                    <Ionicons name="warning" size={20} color={colors.error} />
                    <Text style={[styles.additionalNutrientText, { color: colors.error }]}>
                      {`Trans Fat: ${Math.round(meal.trans_fat)}g`}
                    </Text>
                  </View>
                )}
                {meal.cholesterol && (
                  <View style={styles.additionalNutrient}>
                    <Ionicons name="heart" size={20} color={colors.primary} />
                    <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                      {`Cholesterol: ${Math.round(meal.cholesterol)}mg`}
                    </Text>
                  </View>
                )}
              </View>

              {(meal.potassium || meal.calcium || meal.iron || meal.magnesium || meal.phosphorus || meal.zinc) && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.text, marginTop: Theme.spacing.md }]}>Minerals</Text>
                  <View style={styles.additionalNutrients}>
                    {meal.potassium && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="flash" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Potassium: ${Math.round(meal.potassium)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.calcium && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="cube" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Calcium: ${Math.round(meal.calcium)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.iron && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="magnet" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Iron: ${Math.round(meal.iron)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.magnesium && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="diamond" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Magnesium: ${Math.round(meal.magnesium)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.phosphorus && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="nuclear" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Phosphorus: ${Math.round(meal.phosphorus)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.zinc && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="shield" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Zinc: ${Math.round(meal.zinc)}mg`}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}

              {(meal.vitamin_a || meal.vitamin_c || meal.vitamin_d || meal.vitamin_e || meal.vitamin_k || meal.thiamin || meal.riboflavin || meal.niacin || meal.vitamin_b6 || meal.folate || meal.vitamin_b12) && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.text, marginTop: Theme.spacing.md }]}>Vitamins</Text>
                  <View style={styles.additionalNutrients}>
                    {meal.vitamin_a && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="eye" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Vitamin A: ${typeof meal.vitamin_a === 'number' ? Math.round(meal.vitamin_a) : meal.vitamin_a}`}
                        </Text>
                      </View>
                    )}
                    {meal.vitamin_c && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="sunny" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Vitamin C: ${Math.round(meal.vitamin_c)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.vitamin_d && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="sunny-outline" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Vitamin D: ${typeof meal.vitamin_d === 'number' ? Math.round(meal.vitamin_d) : meal.vitamin_d}`}
                        </Text>
                      </View>
                    )}
                    {meal.vitamin_e && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="leaf-outline" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Vitamin E: ${typeof meal.vitamin_e === 'number' ? Math.round(meal.vitamin_e) : meal.vitamin_e}`}
                        </Text>
                      </View>
                    )}
                    {meal.vitamin_k && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="medical" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Vitamin K: ${meal.vitamin_k}`}
                        </Text>
                      </View>
                    )}
                    {meal.thiamin && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="flask" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Thiamin (B1): ${Math.round(meal.thiamin)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.riboflavin && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="flask-outline" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Riboflavin (B2): ${Math.round(meal.riboflavin)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.niacin && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="flask" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Niacin (B3): ${Math.round(meal.niacin)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.vitamin_b6 && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="flask" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Vitamin B6: ${Math.round(meal.vitamin_b6)}mg`}
                        </Text>
                      </View>
                    )}
                    {meal.folate && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="flower" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Folate: ${meal.folate}`}
                        </Text>
                      </View>
                    )}
                    {meal.vitamin_b12 && (
                      <View style={styles.additionalNutrient}>
                        <Ionicons name="flask" size={20} color={colors.primary} />
                        <Text style={[styles.additionalNutrientText, { color: colors.text }]}>
                          {`Vitamin B12: ${meal.vitamin_b12}`}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </Card>

            {(meal.main_ingredients || meal.allergens || meal.dietary_tags) && (
              <Card style={styles.descriptionCard}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Details</Text>
                {meal.main_ingredients && Array.isArray(meal.main_ingredients) && meal.main_ingredients.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: Theme.spacing.xs }]}>Main Ingredients:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.main_ingredients.map((ingredient, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>{ingredient}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {meal.allergens && Array.isArray(meal.allergens) && meal.allergens.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.detailLabel, { color: colors.error, marginBottom: Theme.spacing.xs }]}>⚠️ Allergens:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.allergens.map((allergen, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.error + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.error }]}>{allergen}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {meal.dietary_tags && Array.isArray(meal.dietary_tags) && meal.dietary_tags.length > 0 && (
                  <View style={styles.detailsSection}>
                    <View style={styles.tagsContainer}>
                      {meal.dietary_tags.map((tag, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            )}

            {meal.description && (
              <Card style={styles.descriptionCard}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {meal.description}
                </Text>
              </Card>
            )}

            {(recipeInfo.ingredients.length > 0 || recipeInfo.steps.length > 0 || recipeInfo.notes) && (
              <Card style={styles.recipeCard}>
                <View style={styles.recipeHeader}>
                  <Ionicons name="restaurant" size={24} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                    Recipe Details
                  </Text>
                </View>

                {recipeInfo.ingredients.length > 0 && (
                  <View style={styles.recipeSection}>
                    <Text style={[styles.recipeSectionTitle, { color: colors.text }]}>Ingredients</Text>
                    <View style={styles.ingredientsList}>
                      {recipeInfo.ingredients.map((ingredient, idx) => (
                        <View key={idx} style={styles.ingredientItem}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                          <Text style={[styles.ingredientText, { color: colors.text }]}>
                            {ingredient}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {recipeInfo.steps.length > 0 && (
                  <View style={styles.recipeSection}>
                    <Text style={[styles.recipeSectionTitle, { color: colors.text }]}>Preparation Steps</Text>
                    <View style={styles.stepsList}>
                      {recipeInfo.steps.map((step, idx) => (
                        <View key={idx} style={styles.stepItem}>
                          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>{idx + 1}</Text>
                          </View>
                          <Text style={[styles.stepText, { color: colors.text }]}>
                            {step}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {recipeInfo.notes && recipeInfo.ingredients.length === 0 && recipeInfo.steps.length === 0 && (
                  <View style={styles.recipeSection}>
                    <Text style={[styles.recipeSectionTitle, { color: colors.text }]}>Analysis</Text>
                    <Text style={[styles.recipeNotes, { color: colors.textSecondary }]}>
                      {recipeInfo.notes}
                    </Text>
                  </View>
                )}
              </Card>
            )}

            {meal.recommendations && (
              <Card style={styles.recommendationsCard}>
                <View style={styles.recipeHeader}>
                  <Ionicons name="bulb" size={24} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                    Expert Tips
                  </Text>
                </View>
                <Text style={[styles.recommendationsText, { color: colors.text }]}>
                  {meal.recommendations}
                </Text>
              </Card>
            )}

            {meal.best_for && (
              <Card style={styles.recommendationsCard}>
                <View style={styles.recipeHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success || colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                    Best For
                  </Text>
                </View>
                
                {meal.best_for.person_types && Array.isArray(meal.best_for.person_types) && meal.best_for.person_types.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Person Types:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.best_for.person_types.map((type, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.success + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.success || colors.primary }]}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {meal.best_for.health_conditions && Array.isArray(meal.best_for.health_conditions) && meal.best_for.health_conditions.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Health Conditions:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.best_for.health_conditions.map((condition, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.info + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.info || colors.primary }]}>{condition}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {meal.best_for.patient_types && Array.isArray(meal.best_for.patient_types) && meal.best_for.patient_types.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Patient Types:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.best_for.patient_types.map((type, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {meal.best_for.lifestyle && Array.isArray(meal.best_for.lifestyle) && meal.best_for.lifestyle.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Lifestyle:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.best_for.lifestyle.map((lifestyle, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.tagText, { color: colors.text }]}>{lifestyle}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            )}

            {meal.health_benefits && Array.isArray(meal.health_benefits) && meal.health_benefits.length > 0 && (
              <Card style={[styles.recommendationsCard, { backgroundColor: colors.success + '08' }]}>
                <View style={styles.recipeHeader}>
                  <Ionicons name="heart" size={24} color={colors.success || colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                    Health Benefits
                  </Text>
                </View>
                {meal.health_benefits.map((benefit, idx) => (
                  <View key={idx} style={styles.benefitItem}>
                    <Ionicons name="checkmark" size={16} color={colors.success || colors.primary} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
                  </View>
                ))}
              </Card>
            )}

            {meal.not_recommended_for && (
              <Card style={[styles.recommendationsCard, { backgroundColor: colors.error + '08' }]}>
                <View style={styles.recipeHeader}>
                  <Ionicons name="warning" size={24} color={colors.error} />
                  <Text style={[styles.sectionTitle, { color: colors.error, marginLeft: Theme.spacing.sm, marginBottom: 0 }]}>
                    Not Recommended For
                  </Text>
                </View>
                
                {meal.not_recommended_for.person_types && Array.isArray(meal.not_recommended_for.person_types) && meal.not_recommended_for.person_types.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Person Types:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.not_recommended_for.person_types.map((type, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.error + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.error }]}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {meal.not_recommended_for.health_conditions && Array.isArray(meal.not_recommended_for.health_conditions) && meal.not_recommended_for.health_conditions.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Health Conditions:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.not_recommended_for.health_conditions.map((condition, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.error + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.error }]}>{condition}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {meal.not_recommended_for.patient_types && Array.isArray(meal.not_recommended_for.patient_types) && meal.not_recommended_for.patient_types.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={[styles.recommendationSubtitle, { color: colors.text }]}>Patient Types:</Text>
                    <View style={styles.tagsContainer}>
                      {meal.not_recommended_for.patient_types.map((type, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.error + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.error }]}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            )}
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
  mealImage: {
    width: '100%',
    height: 250,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  infoCard: {
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Theme.fontSize.sm,
    marginBottom: Theme.spacing.xs,
  },
  infoValue: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  nutrientsCard: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  nutrientItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  nutrientValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginTop: Theme.spacing.xs,
  },
  nutrientLabel: {
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
  },
  additionalNutrients: {
    gap: Theme.spacing.sm,
  },
  additionalNutrient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
  },
  additionalNutrientText: {
    fontSize: Theme.fontSize.base,
  },
  descriptionCard: {
    marginBottom: Theme.spacing.md,
  },
  descriptionText: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
  },
  recipeCard: {
    marginBottom: Theme.spacing.md,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  recipeSection: {
    marginBottom: Theme.spacing.md,
  },
  recipeSectionTitle: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.sm,
  },
  ingredientsList: {
    gap: Theme.spacing.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  ingredientText: {
    flex: 1,
    fontSize: Theme.fontSize.base,
    lineHeight: 20,
  },
  stepsList: {
    gap: Theme.spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  stepText: {
    flex: 1,
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
    paddingTop: 4,
  },
  recipeNotes: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
  },
  recommendationsCard: {
    marginBottom: Theme.spacing.md,
  },
  recommendationsText: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
    marginTop: Theme.spacing.sm,
  },
  subsectionTitle: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  detailsSection: {
    marginBottom: Theme.spacing.md,
  },
  detailLabel: {
    fontSize: Theme.fontSize.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
  },
  tag: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  tagText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
  },
  recommendationSection: {
    marginBottom: Theme.spacing.md,
  },
  recommendationSubtitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
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

