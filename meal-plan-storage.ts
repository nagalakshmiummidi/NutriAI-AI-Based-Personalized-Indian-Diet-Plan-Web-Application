import { calculateNutritionMetrics, type HealthProfileInput } from "@/nutrition";
import { generateMealPlan, type WeeklyMealPlan } from "@/meal-plan-generator";

export interface MealPlanRecord {
  id: number;
  userId: string;
  createdAt: string;
  profile: HealthProfileInput;
  metrics: ReturnType<typeof calculateNutritionMetrics>;
  mealPlan: WeeklyMealPlan;
}

function getCurrentUserId(): string {
  return localStorage.getItem("current-user") || "default";
}

function getStorageKey(userId?: string): string {
  const uid = userId || getCurrentUserId();
  return `nutriplan-meals-${uid}`;
}

export function generateMealPlanRecord(profile: HealthProfileInput): MealPlanRecord {
  const metrics = calculateNutritionMetrics(profile);
  const mealPlan = generateMealPlan(
    metrics.dailyCalories,
    metrics.dietType,
    profile.dietaryPreference === "vegetarian"
  );

  return {
    id: Date.now(),
    userId: getCurrentUserId(),
    createdAt: new Date().toISOString(),
    profile,
    metrics,
    mealPlan,
  };
}

export function saveMealPlan(record: MealPlanRecord): void {
  const plans = getAllMealPlans();
  plans.push(record);
  localStorage.setItem(getStorageKey(record.userId), JSON.stringify(plans));
}

export function getAllMealPlans(): MealPlanRecord[] {
  const plans = localStorage.getItem(getStorageKey());
  return plans ? JSON.parse(plans) : [];
}

export function getMealPlan(id: number): MealPlanRecord | null {
  const plans = getAllMealPlans();
  return plans.find((p) => p.id === id) || null;
}

export function deleteMealPlan(id: number): void {
  const plans = getAllMealPlans();
  const filtered = plans.filter((p) => p.id !== id);
  localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
}

export function updateMealPlan(id: number, updates: Partial<MealPlanRecord>): void {
  const plans = getAllMealPlans();
  const index = plans.findIndex((p) => p.id === id);
  if (index !== -1) {
    plans[index] = { ...plans[index], ...updates };
    localStorage.setItem(getStorageKey(), JSON.stringify(plans));
  }
}
