import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Button } from "@/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/card";
import { Salad, LogOut, User, ClipboardList, TrendingUp, Apple, Loader2, Calendar, Trash2, Target, Activity, Award } from "lucide-react";
import { getAllMealPlans, deleteMealPlan } from "@/meal-plan-storage";
import { getProgressStats } from "@/progress-tracker";
import type { MealPlanRecord } from "@/meal-plan-storage";

interface DemoUser {
  id: string;
  email: string;
  google_user_data?: {
    given_name: string;
    name: string;
    picture: string;
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isPending, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlanRecord[]>([]);
  const [progressStats, setProgressStats] = useState<ReturnType<typeof getProgressStats> | null>(null);
  const [webauthnKeys, setWebauthnKeys] = useState<Array<{id:string;counter:number;createdAt?:string}>>([]);

  useEffect(() => {
    // Get current logged-in user
    const currentUserId = localStorage.getItem("current-user");
    
    if (!currentUserId) {
      if (!isPending) {
        navigate("/");
      }
      return;
    }

    // Try to get user from account storage
    let userData = localStorage.getItem(`account-${currentUserId}`);
    
    // If not found and is demo-user, get from demo-user storage
    if (!userData && currentUserId === "demo-user") {
      userData = localStorage.getItem("demo-user");
    }

    if (userData) {
      setCurrentUser(JSON.parse(userData));
    } else if (!isPending && !user) {
      navigate("/");
      return;
    }

    // Load meal plans
    setMealPlans(getAllMealPlans());
    setLoading(false);
  }, [isPending, navigate, user]);

  // Ensure body shows diet background while on dashboard
  useEffect(() => {
    document.body.classList.add('diet-bg');
    return () => {
      document.body.classList.remove('diet-bg');
    };
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      const stats = getProgressStats();
      setProgressStats(stats);
      // fetch registered WebAuthn keys for this demo user
      (async () => {
        try {
          const res = await fetch(`http://localhost:4000/user-credentials?userId=${currentUser.id}`);
          if (res.ok) {
            const json = await res.json();
            setWebauthnKeys(json.credentials || []);
          } else {
            setWebauthnKeys([]);
          }
        } catch (err) {
          setWebauthnKeys([]);
        }
      })();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    const currentUserId = localStorage.getItem("current-user");
    
    // Clear current user
    localStorage.removeItem("current-user");
    
    // Clear demo-user if it was demo
    if (currentUserId === "demo-user") {
      localStorage.removeItem("demo-user");
    }

    if (user) {
      await logout();
    }
    
    navigate("/");
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen diet-bg">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Salad className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              NutriPlan India
            </span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {currentUser.google_user_data?.picture ? (
                <img
                  src={currentUser.google_user_data.picture}
                  alt={currentUser.google_user_data.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {currentUser.google_user_data?.given_name || currentUser.email}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {currentUser.google_user_data?.given_name || "there"}! 👋
          </h1>
          <p className="text-gray-600">
            Your personalized nutrition dashboard
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="border-0 shadow-lg shadow-orange-100/50 bg-white/80 backdrop-blur cursor-pointer hover:shadow-xl transition-all group"
            onClick={() => navigate("/create-plan")}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Create Diet Plan</CardTitle>
              <CardDescription>
                Generate a new personalized 7-day Indian meal plan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="border-0 shadow-lg shadow-green-100/50 bg-white/80 backdrop-blur cursor-pointer hover:shadow-xl transition-all group"
            onClick={() => {
              if (mealPlans.length > 0) {
                navigate(`/meal-plan/${mealPlans[mealPlans.length - 1].id}`);
              }
            }}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <CardTitle>My Diet Plans</CardTitle>
              <CardDescription>
                {mealPlans.length > 0 ? `${mealPlans.length} plan(s) saved` : "Start creating your first plan"}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg shadow-blue-100/50 bg-white/80 backdrop-blur cursor-pointer hover:shadow-xl transition-all group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                {progressStats ? `${progressStats.daysTracked} days tracked` : "Start your journey"}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* WebAuthn Keys */}
        <div className="mb-8">
          <Card className="border-0 shadow-md bg-white/80 diet-bg-card">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center mb-0">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Registered Security Keys</CardTitle>
                    <CardDescription>WebAuthn credentials registered for this account (demo).</CardDescription>
                  </div>
                </div>
                <div>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!currentUser) return;
                    try {
                      const res = await fetch(`http://localhost:4000/user-credentials?userId=${currentUser.id}`);
                      if (res.ok) {
                        const json = await res.json();
                        setWebauthnKeys(json.credentials || []);
                      }
                    } catch (e) {}
                  }}>Refresh</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {webauthnKeys.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-600">No registered security keys found.</p>
                  <p className="text-xs text-gray-500 mt-2">Use the WebAuthn demo on the Home page to register a biometric key.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {webauthnKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1 pr-4">
                        <div className="text-xs text-gray-500">ID</div>
                        <div className="font-mono text-sm break-all">{k.id.length > 32 ? `${k.id.slice(0,10)}…${k.id.slice(-10)}` : k.id}</div>
                        <div className="text-[11px] text-gray-500">Created: {k.createdAt ? new Date(k.createdAt).toLocaleString() : '—'}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-gray-700">Counter: {k.counter ?? 0}</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => { navigator.clipboard.writeText(k.id); }}>
                            <ClipboardList className="w-4 h-4 mr-2" />Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (!confirm('Delete this security key?')) return;
                              try {
                                const res = await fetch('http://localhost:4000/user-credentials', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: currentUser?.id, credentialId: k.id }),
                                });
                                const json = await res.json();
                                if (json.ok) {
                                  // refresh keys
                                  const r = await fetch(`http://localhost:4000/user-credentials?userId=${currentUser?.id}`);
                                  if (r.ok) {
                                    const j = await r.json();
                                    setWebauthnKeys(j.credentials || []);
                                  }
                                } else {
                                  alert('Delete failed');
                                }
                              } catch (e) {
                                alert('Delete failed');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Tracking Section */}
        {progressStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Progress</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    <span>Current Weight</span>
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    {progressStats.currentWeight} kg
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Goal: {progressStats.targetWeight} kg</p>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span>Weight Loss</span>
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    {progressStats.weightLoss} kg
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{progressStats.weightLossPercent}% of goal</p>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-blue-500" />
                    <span>Days Tracked</span>
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    {progressStats.daysTracked}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Since you started</p>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-purple-500" />
                    <span>Total Plans</span>
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    {progressStats.totalPlans}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Diet plans created</p>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}

        {/* Saved Meal Plans */}
        {mealPlans.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Saved Plans</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mealPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate(`/meal-plan/${plan.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <CardTitle className="text-lg mb-1">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </CardTitle>
                        <CardDescription>
                          {plan.metrics.dailyCalories} kcal/day
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this meal plan?")) {
                            deleteMealPlan(plan.id);
                            setMealPlans(getAllMealPlans());
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{plan.metrics.dietType}</span>
                      <span className="text-xs">{plan.profile.age} yrs, {plan.profile.weight}kg</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center mx-auto mb-4">
                <Salad className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Diet Plans Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first personalized Indian diet plan based on your health profile and goals.
              </p>
              <Button 
                onClick={() => navigate("/create-plan")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
