import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/Home";
import AuthCallbackPage from "@/AuthCallback";
import DashboardPage from "@/Dashboard";
import CreatePlanPage from "@/CreatePlan";
import MealPlanPage from "@/MealPlan";
import { Chatbot } from "@/Chatbot";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-plan" element={<CreatePlanPage />} />
          <Route path="/meal-plan/:id" element={<MealPlanPage />} />
        </Routes>
        <Chatbot />
      </Router>
    </AuthProvider>
  );
}
