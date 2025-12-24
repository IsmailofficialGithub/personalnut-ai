import Constants from 'expo-constants';

// Get API key from expo-constants
const getApiKey = () => {
  return Constants.expoConfig?.extra?.OPENAI_API_KEY || Constants.manifest?.extra?.OPENAI_API_KEY || null;
};

const API_KEY = getApiKey();

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const analyzeFoodImage = async (imageBase64) => {
  try {
    if (!API_KEY) {
      console.error('OPENAI_API_KEY not found. Checked @env and Constants.extra');
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: `As an expert nutritionist, analyze this food image and provide a comprehensive nutritional breakdown. Estimate the portion size visible in the image and provide detailed nutritional information. Return ONLY a valid JSON object with this EXACT structure, no additional text or formatting:

{
  "meal_name": "Name of the dish/food",
  "estimated_quantity": "Estimated portion size (e.g., '1 cup', '200g', '1 medium plate', '2 pieces')",
  "serving_size": "Standard serving size description",
  "calories": estimated_calories_as_number,
  "protein": grams_as_number,
  "carbs": grams_as_number,
  "fat": grams_as_number,
  "saturated_fat": grams_as_number,
  "trans_fat": grams_as_number,
  "monounsaturated_fat": grams_as_number,
  "polyunsaturated_fat": grams_as_number,
  "cholesterol": mg_as_number,
  "fiber": grams_as_number,
  "sugar": grams_as_number,
  "added_sugar": grams_as_number,
  "sodium": mg_as_number,
  "potassium": mg_as_number,
  "calcium": mg_as_number,
  "iron": mg_as_number,
  "magnesium": mg_as_number,
  "phosphorus": mg_as_number,
  "zinc": mg_as_number,
  "vitamin_a": "mcg or IU",
  "vitamin_c": mg_as_number,
  "vitamin_d": "mcg or IU",
  "vitamin_e": "mg or IU",
  "vitamin_k": "mcg",
  "thiamin": mg_as_number,
  "riboflavin": mg_as_number,
  "niacin": mg_as_number,
  "vitamin_b6": mg_as_number,
  "folate": "mcg",
  "vitamin_b12": "mcg",
  "vitamins": {
    "vitamin_a": "amount",
    "vitamin_c": "amount",
    "vitamin_d": "amount",
    "vitamin_e": "amount",
    "vitamin_k": "amount",
    "thiamin": "amount",
    "riboflavin": "amount",
    "niacin": "amount",
    "vitamin_b6": "amount",
    "folate": "amount",
    "vitamin_b12": "amount"
  },
  "minerals": {
    "calcium": "amount",
    "iron": "amount",
    "potassium": "amount",
    "magnesium": "amount",
    "phosphorus": "amount",
    "zinc": "amount"
  },
  "meal_type": "breakfast/lunch/dinner/snack",
  "cuisine_type": "Type of cuisine (e.g., 'Italian', 'Asian', 'American')",
  "cooking_method": "How it was prepared (e.g., 'grilled', 'fried', 'steamed')",
  "main_ingredients": ["ingredient1", "ingredient2", "ingredient3"],
  "allergens": ["allergen1", "allergen2"],
  "dietary_tags": ["tag1", "tag2"],
  "analysis": "3-4 sentence comprehensive analysis of the meal's nutritional value, portion size, and health implications",
  "recommendations": "3-4 sentences of professional nutritionist recommendations including portion control advice",
  "best_for": {
    "person_types": ["athletes", "weight loss", "muscle gain", "elderly", "children", "pregnant women", "diabetics", "vegetarians", "vegans"],
    "health_conditions": ["diabetes", "hypertension", "heart disease", "osteoporosis", "anemia", "digestive issues"],
    "patient_types": ["post-surgery recovery", "chronic disease management", "immune system support", "bone health", "cognitive health"],
    "lifestyle": ["active lifestyle", "sedentary", "high stress", "busy professionals", "students"]
  },
  "not_recommended_for": {
    "person_types": ["specific person types if any"],
    "health_conditions": ["specific conditions if any"],
    "patient_types": ["specific patient types if any"]
  },
  "health_benefits": ["benefit1", "benefit2", "benefit3"],
  "health_score": number_from_1_to_100,
  "suitable_for": ["condition1", "condition2"],
  "warnings": ["warning1", "warning2"]
}

Be precise with numbers. Ensure all values are realistic and evidence-based. Estimate portion size based on visual cues in the image (plate size, utensils, common serving sizes).

For "best_for" recommendations, analyze the nutritional profile and provide specific, evidence-based recommendations for:
- Person types: Based on nutritional needs (e.g., high protein for athletes, low calorie for weight loss)
- Health conditions: Based on specific nutrient content (e.g., low sodium for hypertension, high fiber for digestive health)
- Patient types: Based on recovery and healing needs (e.g., high protein for post-surgery, anti-inflammatory for chronic conditions)
- Lifestyle: Based on convenience and nutritional density

For "not_recommended_for", only include if there are specific contraindications or concerns.

For "health_benefits", list 3-5 specific health benefits this meal provides based on its nutritional composition.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      let errorData = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    let data;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error('Failed to parse API response. Please try again.');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from API');
    }

    let responseText = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if it's embedded in text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response text:', responseText.substring(0, 500));
      
      // Try to fix common JSON issues
      try {
        // Remove any trailing commas
        responseText = responseText.replace(/,(\s*[}\]])/g, '$1');
        analysis = JSON.parse(responseText);
      } catch (secondParseError) {
        // If still fails, try to extract just the JSON object more carefully
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const extractedJson = responseText.substring(jsonStart, jsonEnd);
          try {
            analysis = JSON.parse(extractedJson);
          } catch (thirdParseError) {
            console.error('Final parse attempt failed:', thirdParseError);
            throw new Error('Failed to parse API response. The response format is invalid.');
          }
        } else {
          throw new Error('Failed to parse API response. The response format is invalid.');
        }
      }
    }
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing food image:', error);
    if (error instanceof SyntaxError || error.message?.includes('parse') || error.message?.includes('JSON')) {
      throw new Error('Failed to parse API response. Please try again.');
    }
    throw error.message ? error : new Error('Failed to analyze food image. Please try again.');
  }
};

// Model token limits (completion tokens)
const MODEL_TOKEN_LIMITS = {
  'gpt-4o': 16384,
  'gpt-4o-mini': 16384,
  'gpt-4': 8192,
  'gpt-4-turbo': 4096,
  'gpt-3.5-turbo': 4096,
};

export const generateDietPlan = async (userProfile, goals, duration = 7, budget = 'flexible', customQuestions = '', mealFrequency = 3, allergies = [], healthConditions = []) => {
  const MAX_RETRIES = 2;
  const MODEL = 'gpt-4o-mini'; // Best model for cost/performance with 16K limit
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  try {
    if (!API_KEY) {
      console.error('OPENAI_API_KEY not found. Checked @env and Constants.extra');
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

      // Calculate max_tokens with retry reduction
      const baseMaxTokens = duration <= 7 ? 8000 : duration <= 14 ? 12000 : duration <= 30 ? 15000 : 15000;
      const maxTokens = attempt === 0 ? baseMaxTokens : Math.max(8000, baseMaxTokens - (attempt * 2000));
      const safeMaxTokens = Math.min(maxTokens, MODEL_TOKEN_LIMITS[MODEL] - 1000); // Leave 1K buffer

    const budgetInstructions = {
        low: 'Affordable ingredients: eggs, beans, chicken, seasonal vegetables, grains.',
        medium: 'Balanced mix of moderate-cost ingredients.',
        high: 'Premium ingredients: organic produce, lean meats, specialty items.',
        flexible: 'Any ingredients that fit nutritional goals.',
    };

      const customQuestionsText = customQuestions 
        ? `\nAdditional preferences: ${customQuestions}`
        : '';

      const mealFrequencyInstructions = {
        3: '3 meals: breakfast, lunch, dinner. No snacks.',
        4: '4 meals: breakfast, lunch, dinner, 1 snack.',
        5: '5 meals: breakfast, lunch, dinner, 2 snacks.',
        6: '6 meals: breakfast, lunch, dinner, 3 snacks.',
      };

      // Optimized concise prompt
      const prompt = `Create a ${duration}-day diet plan:

Requirements:
- Duration: ${duration} days exactly
- Meals/day: ${mealFrequency} (${mealFrequencyInstructions[mealFrequency]})
- Budget: ${budget} (${budgetInstructions[budget]})
- Daily calories: ${userProfile.daily_calorie_goal}
- Goals: ${goals.join(', ')}
${allergies.length > 0 ? `- Allergies: ${allergies.join(', ')}` : ''}
${healthConditions.length > 0 ? `- Health: ${healthConditions.join(', ')}` : ''}${customQuestionsText}

User: ${userProfile.age}y, ${userProfile.gender}, ${userProfile.weight}kg, ${userProfile.height}cm, ${userProfile.activity_level}

Return ONLY JSON (no markdown):

{
  "plan_name": "Brief name (max 30 chars)",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "total_calories": ${userProfile.daily_calorie_goal},
      "meals": {
        "breakfast": {"name": "Meal (max 25 chars)", "calories": number, "description": "Brief (max 40 chars)", "ingredients": ["item1", "item2", "item3", "item4", "item5"]},
        "lunch": {"name": "Meal", "calories": number, "description": "Brief", "ingredients": ["item1", "item2", "item3", "item4", "item5"]},
        "dinner": {"name": "Meal", "calories": number, "description": "Brief", "ingredients": ["item1", "item2", "item3", "item4", "item5"]}${mealFrequency > 3 ? ',\n        "snacks": [' + (mealFrequency === 4 ? '{"name": "Snack", "calories": number, "description": "Brief", "ingredients": ["item1", "item2", "item3"]}' : mealFrequency === 5 ? '{"name": "Snack1", "calories": number, "description": "Brief", "ingredients": ["item1", "item2"]}, {"name": "Snack2", "calories": number, "description": "Brief", "ingredients": ["item1", "item2"]}' : '{"name": "Snack1", "calories": number, "description": "Brief", "ingredients": ["item1"]}, {"name": "Snack2", "calories": number, "description": "Brief", "ingredients": ["item1"]}, {"name": "Snack3", "calories": number, "description": "Brief", "ingredients": ["item1"]}') + ']' : ''}
      }
    }
  ],
  "tips": ["Tip1", "Tip2", "Tip3", "Tip4", "Tip5"],
  "shopping_list": ["item1", "item2", "item3", "item4", "item5", "item6", "item7", "item8"]
}

CRITICAL:
- Generate exactly ${duration} days
- Each day has exactly ${mealFrequency} meals
- Descriptions max 40 chars, names max 25 chars
- Ingredients max 5 per meal
- Tips max 5 items
- Shopping list max 8 items
- Keep response concise to stay under ${safeMaxTokens} tokens`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
          model: MODEL,
          max_tokens: safeMaxTokens,
          temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      let errorData = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
        
        const errorMessage = errorData.error?.message || `API error: ${response.status} ${response.statusText}`;
        
        // Retry on token limit errors
        if (errorMessage.includes('max_tokens') || errorMessage.includes('token')) {
          lastError = new Error(errorMessage);
          if (attempt < MAX_RETRIES) {
            console.log(`Attempt ${attempt + 1} failed with token error. Retrying with reduced tokens...`);
            continue; // Retry with lower tokens
          }
        }
        
        throw new Error(errorMessage);
    }

    let data;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error('Failed to parse API response. Please try again.');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from API');
    }

    // Check if response was truncated
    const finishReason = data.choices[0].finish_reason;
    if (finishReason === 'length') {
        console.warn('API response was truncated due to token limit.');
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying with reduced tokens...`);
          lastError = new Error('Response truncated. Retrying with reduced tokens...');
          continue; // Retry with lower tokens
        }
    }

    let responseText = data.choices[0].message.content;
    
    // Clean up the response text - remove markdown code blocks
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if it's embedded in text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    let dietPlan;
    try {
      dietPlan = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response text length:', responseText.length);
      console.error('Response text (first 1000 chars):', responseText.substring(0, 1000));
      
      // Check if JSON appears to be truncated (doesn't end with })
      const trimmedText = responseText.trim();
      const isTruncated = !trimmedText.endsWith('}') && !trimmedText.endsWith(']');
      
      if (isTruncated) {
        console.warn('JSON appears to be truncated. Attempting to repair...');
        let repairedText = responseText;
        
        // Count unmatched braces and brackets
        let braceCount = 0;
        let bracketCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < repairedText.length; i++) {
          const char = repairedText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            else if (char === '}') braceCount--;
            else if (char === '[') bracketCount++;
            else if (char === ']') bracketCount--;
          }
        }
        
        // Find the last complete day object by looking for complete meal structures
        // Look for the last complete closing brace that's likely the end of a day
        const dayPattern = /"day":\s*\d+/g;
        const dayMatches = [...repairedText.matchAll(dayPattern)];
        
        if (dayMatches.length > 0) {
          // Find the last complete day by looking backwards for complete structures
          let bestCutPoint = -1;
          
          // Try to find where the last complete day ends
          for (let i = repairedText.length - 1; i >= 0; i--) {
            if (repairedText[i] === '}') {
              // Check if this might be the end of a complete day
              const beforeBrace = repairedText.substring(Math.max(0, i - 100), i);
              if (beforeBrace.includes('"snacks"') || beforeBrace.includes('"dinner"')) {
                // This looks like the end of a day's meals object
                bestCutPoint = i;
                break;
              }
            }
          }
          
          if (bestCutPoint > 0 && bestCutPoint > repairedText.length - 500) {
            // Cut at this point and close structures
            repairedText = repairedText.substring(0, bestCutPoint + 1);
            
            // Close days array if needed
            if (bracketCount > 0) {
              repairedText += ']';
              bracketCount--;
            }
            
            // Close main object
            if (braceCount > 0) {
              repairedText += '}';
              braceCount--;
            }
          }
        }
        
        // Fallback: remove incomplete trailing content and close structures
        if (!repairedText.trim().endsWith('}')) {
          // Find the last safe cut point (complete string, number, or structure)
          const safeCutPoints = [
            repairedText.lastIndexOf('"', repairedText.length - 50),
            repairedText.lastIndexOf('}', repairedText.length - 50),
            repairedText.lastIndexOf(']', repairedText.length - 50),
            repairedText.lastIndexOf(',', repairedText.length - 50),
          ].filter(p => p > repairedText.length - 200);
          
          if (safeCutPoints.length > 0) {
            const cutPoint = Math.max(...safeCutPoints);
            repairedText = repairedText.substring(0, cutPoint + (repairedText[cutPoint] === '"' ? 1 : 0));
          }
          
          // Close remaining structures
          for (let i = 0; i < bracketCount; i++) {
            repairedText += ']';
          }
          for (let i = 0; i < braceCount; i++) {
            repairedText += '}';
          }
        }
        
        // Try parsing the repaired JSON
        try {
          // Remove any trailing commas before closing braces/brackets
          repairedText = repairedText.replace(/,(\s*[}\]])/g, '$1');
          dietPlan = JSON.parse(repairedText);
          console.log('Successfully repaired truncated JSON');
        } catch (repairError) {
          console.error('Failed to repair truncated JSON:', repairError);
          console.error('Repaired text (last 500 chars):', repairedText.substring(Math.max(0, repairedText.length - 500)));
          throw new Error('API response was truncated and could not be repaired. The diet plan was too long. Please try generating a shorter plan (fewer days) or the response exceeded token limits.');
        }
      } else {
        // Not truncated, try to fix common JSON issues
        try {
          // Remove any trailing commas
          responseText = responseText.replace(/,(\s*[}\]])/g, '$1');
          // Remove comments (though JSON shouldn't have them)
          responseText = responseText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
          dietPlan = JSON.parse(responseText);
        } catch (secondParseError) {
          // If still fails, try to extract just the JSON object more carefully
          const jsonStart = responseText.indexOf('{');
          const jsonEnd = responseText.lastIndexOf('}') + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const extractedJson = responseText.substring(jsonStart, jsonEnd);
            try {
              // Try one more time with cleaned JSON
              const cleanedJson = extractedJson.replace(/,(\s*[}\]])/g, '$1');
              dietPlan = JSON.parse(cleanedJson);
            } catch (thirdParseError) {
              console.error('Final parse attempt failed:', thirdParseError);
              console.error('Extracted JSON (first 500 chars):', extractedJson.substring(0, 500));
              throw new Error('Failed to parse API response. The response format is invalid.');
            }
          } else {
            throw new Error('Failed to parse API response. The response format is invalid.');
          }
        }
      }
    }
    
    // Validate the diet plan structure
    if (!dietPlan.plan_name || !dietPlan.days || !Array.isArray(dietPlan.days)) {
      throw new Error('Invalid diet plan structure received from API');
    }
    
      // Success - return the diet plan
    return dietPlan;
      
  } catch (error) {
      lastError = error;
      console.error(`Error generating diet plan (attempt ${attempt + 1}):`, error);
      
      // Don't retry for non-token errors on final attempt
      if (attempt === MAX_RETRIES) {
    if (error instanceof SyntaxError || error.message?.includes('parse') || error.message?.includes('JSON')) {
      throw new Error('Failed to parse API response. Please try again.');
    }
        if (error.message?.includes('max_tokens') || error.message?.includes('token')) {
          throw new Error('Diet plan is too long. Please try a shorter duration (7-14 days) or reduce meal frequency.');
        }
    throw error.message ? error : new Error('Failed to generate diet plan. Please try again.');
  }
      
      // Continue to retry if not final attempt
      if (error.message?.includes('max_tokens') || error.message?.includes('token') || error.message?.includes('truncated')) {
        console.log(`Retrying with reduced tokens...`);
        continue;
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Failed to generate diet plan after multiple attempts.');
};

export const getNutritionAdvice = async (question, userContext) => {
  try {
    if (!API_KEY) {
      console.error('OPENAI_API_KEY not found. Checked @env and Constants.extra');
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    const prompt = `As an expert nutritionist, answer this question: "${question}"

User context:
${userContext ? `- Health conditions: ${Array.isArray(userContext.health_conditions) ? userContext.health_conditions.join(', ') : userContext.health_conditions || 'None'}
- Dietary preferences: ${Array.isArray(userContext.dietary_preferences) ? userContext.dietary_preferences.join(', ') : userContext.dietary_preferences || 'None'}
- Current goals: ${typeof userContext.goals === 'string' ? userContext.goals : (Array.isArray(userContext.goals) ? userContext.goals.join(', ') : 'None')}` : ''}

Provide a helpful, evidence-based response as a professional nutritionist would.`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      let errorData = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    let data;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error('Failed to parse API response. Please try again.');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting nutrition advice:', error);
    throw error.message ? error : new Error('Failed to get nutrition advice. Please try again.');
  }
};