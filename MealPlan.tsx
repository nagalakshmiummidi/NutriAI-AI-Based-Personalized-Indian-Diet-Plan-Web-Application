import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/tabs";
import { Badge } from "@/badge";
import { 
  Salad, ArrowLeft, Loader2, RefreshCw, Coffee, Sun, Moon, Cookie,
  Flame, Drumstick, Wheat, Droplets, Calendar, Leaf, Trash2, Download, ChefHat
} from "lucide-react";
import { getMealPlan, deleteMealPlan } from "@/meal-plan-storage";
import type { MealPlanRecord } from "@/meal-plan-storage";
import type { Meal } from "@/indian-meals";

export default function MealPlanPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [data, setData] = useState<MealPlanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState("1");

  useEffect(() => {
    if (id) {
      try {
        const mealPlanId = parseInt(id);
        const plan = getMealPlan(mealPlanId);
        if (plan) {
          setData(plan);
        } else {
          setError("Meal plan not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  // Add body-level diet background while viewing a meal plan
  useEffect(() => {
    document.body.classList.add('diet-bg');
    return () => document.body.classList.remove('diet-bg');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || "Could not load meal plan"}</p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this meal plan?")) {
      if (id) {
        deleteMealPlan(parseInt(id));
      }
      navigate("/dashboard");
    }
  };

  const handleDownload = () => {
    const text = JSON.stringify(data, null, 2);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", `meal-plan-${data.id}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const { profile, metrics, mealPlan } = data;

  return (
    <div className="min-h-screen diet-bg">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Salad className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              NutriPlan India
            </span>
          </button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Plan Summary */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your 7-Day Meal Plan</h1>
              <p className="text-gray-600">Personalized Indian meals based on your profile</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="pt-4 pb-4 text-center">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-600">{metrics.dailyCalories}</p>
                <p className="text-xs text-gray-600">Daily Calories</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-4 pb-4 text-center">
                <Drumstick className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{metrics.proteinGrams}g</p>
                <p className="text-xs text-gray-600">Protein</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="pt-4 pb-4 text-center">
                <Wheat className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-600">{metrics.carbsGrams}g</p>
                <p className="text-xs text-gray-600">Carbs</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-4 pb-4 text-center">
                <Droplets className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{metrics.fatsGrams}g</p>
                <p className="text-xs text-gray-600">Fats</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {metrics.dietType}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {profile.dietaryPreference === "vegetarian" ? (
                <><Leaf className="w-3 h-3 mr-1" /> Vegetarian</>
              ) : (
                "Non-Vegetarian"
              )}
            </Badge>
          </div>
        </div>

        {/* Day Tabs */}
        <Tabs value={activeDay} onValueChange={setActiveDay} className="space-y-6">
          <TabsList className="grid grid-cols-7 h-auto p-1 bg-white shadow-md">
            {mealPlan.days.map((day) => (
              <TabsTrigger
                key={day.day}
                value={day.day.toString()}
                className="flex flex-col py-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <span className="text-xs opacity-70">{day.dayName.slice(0, 3)}</span>
                <span className="font-bold">Day {day.day}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {mealPlan.days.map((day) => (
            <TabsContent key={day.day} value={day.day.toString()} className="space-y-6">
              {/* Day Summary */}
              <Card className="border-0 shadow-lg bg-white/80">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold">{day.dayName}'s Nutrition</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <strong>{day.totalCalories}</strong> kcal
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <strong>{day.totalProtein}g</strong> protein
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <strong>{day.totalCarbs}g</strong> carbs
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <strong>{day.totalFats}g</strong> fats
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meals */}
              <div className="grid md:grid-cols-2 gap-6">
                <MealCard 
                  meal={day.breakfast} 
                  icon={<Coffee className="w-5 h-5" />}
                  label="Breakfast"
                  color="from-amber-500 to-orange-500"
                />
                <MealCard 
                  meal={day.lunch} 
                  icon={<Sun className="w-5 h-5" />}
                  label="Lunch"
                  color="from-orange-500 to-red-500"
                />
                <MealCard 
                  meal={day.dinner} 
                  icon={<Moon className="w-5 h-5" />}
                  label="Dinner"
                  color="from-indigo-500 to-purple-500"
                />
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-teal-500 text-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Cookie className="w-5 h-5" />
                      Snacks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {day.snacks.map((snack, idx) => (
                      <div key={snack.id} className={idx > 0 ? "pt-4 border-t" : ""}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{snack.name}</h4>
                            {snack.nameHindi && (
                              <p className="text-sm text-orange-600">{snack.nameHindi}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">{snack.description}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {snack.calories} kcal
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}

function MealCard({ 
  meal, 
  icon, 
  label, 
  color 
}: { 
  meal: Meal; 
  icon: React.ReactNode; 
  label: string;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className={`pb-3 bg-gradient-to-r ${color} text-white`}>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">{meal.name}</h4>
            {meal.nameHindi && (
              <p className="text-sm text-orange-600">{meal.nameHindi}</p>
            )}
          </div>
          {meal.isVegetarian && (
            <Badge className="bg-green-100 text-green-700 shrink-0">
              <Leaf className="w-3 h-3 mr-1" /> Veg
            </Badge>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4">{meal.description}</p>
        
        {/* Nutrition */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg text-center">
          <div>
            <p className="text-lg font-bold text-orange-600">{meal.calories}</p>
            <p className="text-xs text-gray-500">kcal</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{meal.protein}g</p>
            <p className="text-xs text-gray-500">Protein</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{meal.carbs}g</p>
            <p className="text-xs text-gray-500">Carbs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{meal.fats}g</p>
            <p className="text-xs text-gray-500">Fats</p>
          </div>
        </div>

        {/* Ingredients */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">INGREDIENTS</p>
          <div className="flex flex-wrap gap-1">
            {meal.ingredients.map((ingredient, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-gray-100">
                {ingredient}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
