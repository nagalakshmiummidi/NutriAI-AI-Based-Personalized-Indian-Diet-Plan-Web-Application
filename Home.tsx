import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Button } from "@/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/card";
import { Input } from "@/input";
import { Label } from "@/label";
import { Apple, Salad, Target, TrendingUp, Scale, Loader2, LogIn, Mail, X } from "lucide-react";

const DEMO_USER = {
  id: "demo-user",
  email: "demo@nutriplan.local",
  google_user_data: {
    given_name: "Demo",
    name: "Demo User",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user",
  },
};

const GOOGLE_USER = {
  id: `google-${Date.now()}`,
  email: "user@gmail.com",
  google_user_data: {
    given_name: "User",
    name: "Google User",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=google-user",
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isPending, redirectToLogin } = useAuth();
  const [hasDemoUser, setHasDemoUser] = useState(false);
  
  // Sign In State
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState("");
  
  // Sign Up State
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState("");

  useEffect(() => {
    const storedDemo = localStorage.getItem("demo-user");
    if (storedDemo) {
      setHasDemoUser(true);
      navigate("/dashboard");
    }
    
    const storedCurrentUser = localStorage.getItem("current-user");
    if (storedCurrentUser && !storedDemo) {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    if (!isPending && user) {
      navigate("/dashboard");
    }
  }, [user, isPending, navigate]);

  const handleDemoLogin = () => {
    localStorage.setItem("demo-user", JSON.stringify(DEMO_USER));
    localStorage.setItem("current-user", DEMO_USER.id);
    setHasDemoUser(true);
    navigate("/dashboard");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setSignInError("Please enter both email and password");
      return;
    }

    if (!signInEmail.includes("@")) {
      setSignInError("Please enter a valid email");
      return;
    }

    setSignInError("");
    setSignInLoading(true);
    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userId = `user-${btoa(signInEmail).replace(/=/g, "")}`;
      const storedAccount = localStorage.getItem(`account-${userId}`);
      
      if (!storedAccount) {
        setSignInError("Account not found. Please sign up first.");
        setSignInLoading(false);
        return;
      }

      const account = JSON.parse(storedAccount);
      
      if (account.password !== signInPassword) {
        setSignInError("Incorrect password");
        setSignInLoading(false);
        return;
      }
      
      // Set as current user
      localStorage.setItem("current-user", userId);
      
      setSignInEmail("");
      setSignInPassword("");
      setShowSignIn(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Sign in error:", err);
      setSignInError("Sign in failed. Please try again.");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signUpEmail.trim() || !signUpPassword.trim() || !signUpConfirmPassword.trim()) {
      setSignUpError("Please fill in all fields");
      return;
    }

    if (!signUpEmail.includes("@")) {
      setSignUpError("Please enter a valid email");
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Passwords do not match");
      return;
    }

    setSignUpError("");
    setSignUpLoading(true);
    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const givenName = signUpEmail.split("@")[0];
      const userId = `user-${btoa(signUpEmail).replace(/=/g, "")}`;
      
      // Check if account already exists
      const existingAccount = localStorage.getItem(`account-${userId}`);
      if (existingAccount) {
        setSignUpError("Email already registered. Please sign in instead.");
        setSignUpLoading(false);
        return;
      }
      
      const newAccount = {
        id: userId,
        email: signUpEmail,
        password: signUpPassword,
        google_user_data: {
          given_name: givenName.charAt(0).toUpperCase() + givenName.slice(1),
          name: givenName.charAt(0).toUpperCase() + givenName.slice(1),
          picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${signUpEmail}`,
        },
        createdAt: new Date().toISOString(),
      };
      
      // Store user account
      localStorage.setItem(`account-${userId}`, JSON.stringify(newAccount));
      // Set as current user
      localStorage.setItem("current-user", userId);
      
      setSignUpEmail("");
      setSignUpPassword("");
      setSignUpConfirmPassword("");
      setShowSignUp(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Sign up error:", err);
      setSignUpError("Sign up failed. Please try again.");
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleGetStarted = () => {
    setShowSignUp(true);
    setSignUpError("");
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Hero Section */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Salad className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              NutriPlan India
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDemoLogin}
              variant="outline"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Try Demo
            </Button>
            <Button 
              onClick={() => setShowSignIn(true)}
              variant="outline"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => setShowSignUp(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Sign Up
            </Button>
          </div>
          <div className="mt-4">
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Apple className="w-4 h-4" />
                AI-Powered Nutrition Planning
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Personalized Indian Diet Plans
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                  Tailored Just for You
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Get a science-backed 7-day meal plan with authentic Indian foods, 
                calculated based on your BMI, BMR, and health goals.
              </p>
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all"
              >
                Get Started Free
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <Card className="border-0 shadow-xl shadow-orange-100/50 bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-4">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>Smart Calculations</CardTitle>
                  <CardDescription>
                    Accurate BMI, BMR using Mifflin-St Jeor formula, and daily calorie calculations based on your activity level
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-xl shadow-green-100/50 bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>Goal-Based Plans</CardTitle>
                  <CardDescription>
                    Whether you want to lose weight, gain muscle, or maintain - get diet types like Low Carb, High Protein, or Balanced
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-xl shadow-blue-100/50 bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>Track Progress</CardTitle>
                  <CardDescription>
                    Interactive dashboard with charts to visualize your nutrition breakdown and track your health journey
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Foods Section */}
        <section className="py-16 px-4 bg-white/50">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Authentic Indian Cuisine</h2>
            <p className="text-gray-600 mb-8">
              Our meal plans feature delicious, nutritious Indian foods you'll love
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Idli", "Dosa", "Upma", "Chapati", "Brown Rice", "Dal",
                "Rajma", "Paneer", "Chicken Curry", "Egg Curry", "Sprouts",
                "Fruits", "Curd", "Buttermilk", "Poha", "Paratha"
              ].map((food) => (
                <span
                  key={food}
                  className="px-4 py-2 bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200 rounded-full text-gray-700 font-medium hover:shadow-md transition-shadow"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Create Your Profile</h3>
                <p className="text-gray-600">Enter your age, height, weight, activity level, and health goals</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Your Analysis</h3>
                <p className="text-gray-600">We calculate your BMI, BMR, and daily calorie needs</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Receive Your Plan</h3>
                <p className="text-gray-600">Get a personalized 7-day Indian meal plan with PDF download</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-green-500">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Diet?
            </h2>
            <p className="text-white/90 mb-8">
              Join thousands who have improved their health with personalized Indian diet plans
            </p>
            <Button 
              size="lg" 
              onClick={redirectToLogin}
              className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              Get Your Free Diet Plan
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 NutriPlan India. Built for B.Tech Capstone Project.</p>
        </div>
      </footer>

      {/* Sign In Dialog */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                </div>
                <button
                  onClick={() => setShowSignIn(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                {signInError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {signInError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    disabled={signInLoading}
                    className="border-2 border-gray-200 focus:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    disabled={signInLoading}
                    className="border-2 border-gray-200 focus:border-orange-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!signInEmail.trim() || !signInPassword.trim() || signInLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2"
                >
                  {signInLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignIn(false);
                      setShowSignUp(true);
                      setSignInEmail("");
                      setSignInPassword("");
                      setSignInError("");
                    }}
                    className="text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    Sign Up
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSignIn(false);
                    setSignInEmail("");
                    setSignInPassword("");
                    setSignInError("");
                  }}
                  disabled={signInLoading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Dialog */}
      {showSignUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
                </div>
                <button
                  onClick={() => setShowSignUp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                {signUpError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {signUpError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    disabled={signUpLoading}
                    className="border-2 border-gray-200 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    disabled={signUpLoading}
                    className="border-2 border-gray-200 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-gray-700 font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    disabled={signUpLoading}
                    className="border-2 border-gray-200 focus:border-green-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!signUpEmail.trim() || !signUpPassword.trim() || !signUpConfirmPassword.trim() || signUpLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
                >
                  {signUpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignUp(false);
                      setShowSignIn(true);
                      setSignUpEmail("");
                      setSignUpPassword("");
                      setSignUpConfirmPassword("");
                      setSignUpError("");
                    }}
                    className="text-green-600 hover:text-green-700 font-semibold"
                  >
                    Sign In
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSignUp(false);
                    setSignUpEmail("");
                    setSignUpPassword("");
                    setSignUpConfirmPassword("");
                    setSignUpError("");
                  }}
                  disabled={signUpLoading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
