// Types for health profile and diet calculations

export interface HealthProfileInput {
  age: number;
  gender: "male" | "female";
  height: number; // cm
  weight: number; // kg
  activityLevel: "light" | "moderate" | "heavy";
  goal: "weight_loss" | "weight_gain" | "maintain";
  dietaryPreference: "vegetarian" | "non_vegetarian";
  healthCondition: "diabetes" | "thyroid" | "none";
}

export interface NutritionCalculations {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  dailyCalories: number;
  dietType: string;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

export interface HealthProfile extends HealthProfileInput, NutritionCalculations {
  id: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculate BMI (Body Mass Index)
 * Formula: weight (kg) / height (m)²
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category based on WHO standards
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * Male: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age in years) + 5
 * Female: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age in years) − 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female"
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

/**
 * Calculate daily calorie requirements based on activity level and goal
 * Activity multipliers:
 * - Light: 1.375 (little or no exercise)
 * - Moderate: 1.55 (moderate exercise 3-5 days/week)
 * - Heavy: 1.725 (hard exercise 6-7 days/week)
 */
export function calculateDailyCalories(
  bmr: number,
  activityLevel: "light" | "moderate" | "heavy",
  goal: "weight_loss" | "weight_gain" | "maintain"
): number {
  const activityMultipliers = {
    light: 1.375,
    moderate: 1.55,
    heavy: 1.725,
  };

  const maintenanceCalories = Math.round(bmr * activityMultipliers[activityLevel]);

  // Adjust based on goal
  switch (goal) {
    case "weight_loss":
      return Math.round(maintenanceCalories * 0.8); // 20% deficit
    case "weight_gain":
      return Math.round(maintenanceCalories * 1.15); // 15% surplus
    default:
      return maintenanceCalories;
  }
}

/**
 * Classify diet type based on goal, BMI, and health conditions
 * Uses decision tree logic similar to ML classification
 */
export function classifyDietType(
  goal: "weight_loss" | "weight_gain" | "maintain",
  bmi: number,
  healthCondition: "diabetes" | "thyroid" | "none"
): string {
  // Decision tree for diet classification
  if (healthCondition === "diabetes") {
    // Diabetic patients need low carb diets
    return "Low Carb";
  }

  if (healthCondition === "thyroid") {
    // Thyroid patients benefit from balanced diets
    return "Balanced";
  }

  // Based on goal and BMI
  if (goal === "weight_loss") {
    if (bmi >= 30) {
      return "Low Carb"; // Obese: aggressive carb reduction
    }
    return "High Protein"; // Overweight: protein for satiety
  }

  if (goal === "weight_gain") {
    return "High Protein"; // Need protein for muscle building
  }

  // Maintain weight
  if (bmi < 18.5) {
    return "Balanced"; // Underweight: balanced nutrition
  }

  return "Balanced"; // Normal BMI: maintain with balanced diet
}

/**
 * Calculate macronutrient breakdown based on diet type and daily calories
 * Returns grams of protein, carbs, and fats
 */
export function calculateMacros(
  dailyCalories: number,
  dietType: string
): { proteinGrams: number; carbsGrams: number; fatsGrams: number } {
  // Macro ratios by diet type (protein/carbs/fats as percentage of calories)
  const macroRatios: Record<string, { protein: number; carbs: number; fats: number }> = {
    "Low Carb": { protein: 0.35, carbs: 0.20, fats: 0.45 },
    "High Protein": { protein: 0.40, carbs: 0.35, fats: 0.25 },
    "Balanced": { protein: 0.25, carbs: 0.50, fats: 0.25 },
  };

  const ratios = macroRatios[dietType] || macroRatios["Balanced"];

  // Calories per gram: Protein = 4, Carbs = 4, Fats = 9
  return {
    proteinGrams: Math.round((dailyCalories * ratios.protein) / 4),
    carbsGrams: Math.round((dailyCalories * ratios.carbs) / 4),
    fatsGrams: Math.round((dailyCalories * ratios.fats) / 9),
  };
}

/**
 * Calculate all nutrition metrics from health profile input
 */
export function calculateNutritionMetrics(input: HealthProfileInput): NutritionCalculations {
  const bmi = calculateBMI(input.weight, input.height);
  const bmiCategory = getBMICategory(bmi);
  const bmr = calculateBMR(input.weight, input.height, input.age, input.gender);
  const dailyCalories = calculateDailyCalories(bmr, input.activityLevel, input.goal);
  const dietType = classifyDietType(input.goal, bmi, input.healthCondition);
  const macros = calculateMacros(dailyCalories, dietType);

  return {
    bmi,
    bmiCategory,
    bmr,
    dailyCalories,
    dietType,
    ...macros,
  };
}
