// Meal plan generation algorithm

import { getMealsByTypeWithFallback, type Meal } from "./indian-meals";

export interface DayPlan {
  day: number;
  dayName: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface WeeklyMealPlan {
  days: DayPlan[];
  targetCalories: number;
  dietType: string;
  isVegetarian: boolean;
  totalWeeklyCalories: number;
  averageDailyCalories: number;
}

const dayNames = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Select meals with variety (avoid repeating same meal in consecutive days)
function selectMealsWithVariety(
  meals: Meal[],
  count: number,
  usedRecently: Set<string>
): Meal[] {
  // Prioritize meals not used recently
  const available = meals.filter(m => !usedRecently.has(m.id));
  const shuffled = shuffleArray(available.length >= count ? available : meals);
  return shuffled.slice(0, count);
}

// Calculate target calories per meal type
function calculateMealTargets(dailyCalories: number): {
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
} {
  // Standard meal distribution: 25% breakfast, 35% lunch, 30% dinner, 10% snacks
  return {
    breakfast: Math.round(dailyCalories * 0.25),
    lunch: Math.round(dailyCalories * 0.35),
    dinner: Math.round(dailyCalories * 0.30),
    snacks: Math.round(dailyCalories * 0.10),
  };
}

// Generate a 7-day meal plan
export function generateMealPlan(
  dailyCalories: number,
  dietType: string,
  isVegetarian: boolean
): WeeklyMealPlan {
  calculateMealTargets(dailyCalories);
  const days: DayPlan[] = [];
  
  // Track recently used meals for variety
  const usedBreakfasts = new Set<string>();
  const usedLunches = new Set<string>();
  const usedDinners = new Set<string>();
  const usedSnacks = new Set<string>();

  // Get available meals
  const breakfasts = getMealsByTypeWithFallback("breakfast", isVegetarian, dietType);
  const lunches = getMealsByTypeWithFallback("lunch", isVegetarian, dietType);
  const dinners = getMealsByTypeWithFallback("dinner", isVegetarian, dietType);
  const snacks = getMealsByTypeWithFallback("snack", isVegetarian, dietType);

  for (let day = 0; day < 7; day++) {
    // Clear used sets if we've used most meals (for variety in second half of week)
    if (day === 4) {
      usedBreakfasts.clear();
      usedLunches.clear();
      usedDinners.clear();
      usedSnacks.clear();
    }

    // Select breakfast
    const [breakfast] = selectMealsWithVariety(breakfasts, 1, usedBreakfasts);
    usedBreakfasts.add(breakfast.id);

    // Select lunch
    const [lunch] = selectMealsWithVariety(lunches, 1, usedLunches);
    usedLunches.add(lunch.id);

    // Select dinner
    const [dinner] = selectMealsWithVariety(dinners, 1, usedDinners);
    usedDinners.add(dinner.id);

    // Select 1-2 snacks
    const daySnacks = selectMealsWithVariety(snacks, 2, usedSnacks);
    daySnacks.forEach(s => usedSnacks.add(s.id));

    // Calculate totals for the day
    const totalCalories = breakfast.calories + lunch.calories + dinner.calories + 
      daySnacks.reduce((sum, s) => sum + s.calories, 0);
    const totalProtein = breakfast.protein + lunch.protein + dinner.protein +
      daySnacks.reduce((sum, s) => sum + s.protein, 0);
    const totalCarbs = breakfast.carbs + lunch.carbs + dinner.carbs +
      daySnacks.reduce((sum, s) => sum + s.carbs, 0);
    const totalFats = breakfast.fats + lunch.fats + dinner.fats +
      daySnacks.reduce((sum, s) => sum + s.fats, 0);

    days.push({
      day: day + 1,
      dayName: dayNames[day],
      breakfast,
      lunch,
      dinner,
      snacks: daySnacks,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
    });
  }

  const totalWeeklyCalories = days.reduce((sum, d) => sum + d.totalCalories, 0);

  return {
    days,
    targetCalories: dailyCalories,
    dietType,
    isVegetarian,
    totalWeeklyCalories,
    averageDailyCalories: Math.round(totalWeeklyCalories / 7),
  };
}
