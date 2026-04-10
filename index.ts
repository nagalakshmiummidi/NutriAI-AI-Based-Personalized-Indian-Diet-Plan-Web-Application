import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { calculateNutritionMetrics, type HealthProfileInput } from "./nutrition";
import { generateMealPlan } from "./meal-plan-generator";

const app = new Hono<{ Bindings: Env }>();

// Get OAuth redirect URL for Google login
app.get("/api/oauth/google/redirect_url", async (c) => {
  try {
    if (!c.env.MOCHA_USERS_SERVICE_API_URL || !c.env.MOCHA_USERS_SERVICE_API_KEY) {
      return c.json({ error: "OAuth service not configured" }, 500);
    }
    const redirectUrl = await getOAuthRedirectUrl("google", {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
    return c.json({ redirectUrl }, 200);
  } catch (error) {
    console.error("OAuth redirect error:", error);
    return c.json({ error: "Failed to get OAuth redirect URL" }, 500);
  }
});

// Exchange OAuth code for session token
app.post("/api/sessions", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.code) {
      return c.json({ error: "No authorization code provided" }, 400);
    }

    if (!c.env.MOCHA_USERS_SERVICE_API_URL || !c.env.MOCHA_USERS_SERVICE_API_KEY) {
      return c.json({ error: "OAuth service not configured" }, 500);
    }

    const sessionToken = await exchangeCodeForSessionToken(body.code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Session creation error:", error);
    return c.json({ error: "Failed to create session" }, 500);
  }
});

// Get current authenticated user
app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Logout - delete session
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Create health profile and generate diet plan
app.post("/api/health-profiles", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<HealthProfileInput>();

  // Validate input
  if (!body.age || !body.gender || !body.height || !body.weight || 
      !body.activityLevel || !body.goal || !body.dietaryPreference || !body.healthCondition) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Calculate nutrition metrics
  const metrics = calculateNutritionMetrics(body);

  // Save to database
  const result = await c.env.DB.prepare(`
    INSERT INTO health_profiles (
      user_id, age, gender, height_cm, weight_kg, activity_level, goal,
      dietary_preference, health_condition, bmi, bmi_category, bmr,
      daily_calories, diet_type, protein_grams, carbs_grams, fats_grams
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    user.id,
    body.age,
    body.gender,
    body.height,
    body.weight,
    body.activityLevel,
    body.goal,
    body.dietaryPreference,
    body.healthCondition,
    metrics.bmi,
    metrics.bmiCategory,
    metrics.bmr,
    metrics.dailyCalories,
    metrics.dietType,
    metrics.proteinGrams,
    metrics.carbsGrams,
    metrics.fatsGrams
  ).run();

  const profileId = result.meta.last_row_id;

  return c.json({
    id: profileId,
    ...body,
    ...metrics,
  }, 201);
});

// Get user's health profiles
app.get("/api/health-profiles", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM health_profiles 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(user.id).all();

  return c.json(results);
});

// Get specific health profile
app.get("/api/health-profiles/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const profileId = c.req.param("id");

  const profile = await c.env.DB.prepare(`
    SELECT * FROM health_profiles 
    WHERE id = ? AND user_id = ?
  `).bind(profileId, user.id).first();

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json(profile);
});

// Preview calculations without saving (for form preview)
app.post("/api/calculate-preview", authMiddleware, async (c) => {
  const body = await c.req.json<HealthProfileInput>();

  // Validate input
  if (!body.age || !body.gender || !body.height || !body.weight || 
      !body.activityLevel || !body.goal || !body.dietaryPreference || !body.healthCondition) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const metrics = calculateNutritionMetrics(body);
  return c.json(metrics);
});

// Generate meal plan for a health profile
app.get("/api/health-profiles/:id/meal-plan", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const profileId = c.req.param("id");

  // Get health profile
  const profile = await c.env.DB.prepare(`
    SELECT * FROM health_profiles 
    WHERE id = ? AND user_id = ?
  `).bind(profileId, user.id).first();

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  // Check if meal plan already exists
  const existingPlan = await c.env.DB.prepare(`
    SELECT * FROM diet_plans 
    WHERE health_profile_id = ? AND user_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).bind(profileId, user.id).first();

  if (existingPlan) {
    return c.json({
      id: existingPlan.id,
      profile,
      plan: JSON.parse(existingPlan.plan_data as string),
    });
  }

  // Generate new meal plan
  const isVegetarian = profile.dietary_preference === "vegetarian";
  const plan = generateMealPlan(
    profile.daily_calories as number,
    profile.diet_type as string,
    isVegetarian
  );

  // Save to database
  const result = await c.env.DB.prepare(`
    INSERT INTO diet_plans (user_id, health_profile_id, plan_data)
    VALUES (?, ?, ?)
  `).bind(user.id, profileId, JSON.stringify(plan)).run();

  return c.json({
    id: result.meta.last_row_id,
    profile,
    plan,
  });
});

// Regenerate meal plan
app.post("/api/health-profiles/:id/meal-plan/regenerate", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const profileId = c.req.param("id");

  // Get health profile
  const profile = await c.env.DB.prepare(`
    SELECT * FROM health_profiles 
    WHERE id = ? AND user_id = ?
  `).bind(profileId, user.id).first();

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  // Generate new meal plan
  const isVegetarian = profile.dietary_preference === "vegetarian";
  const plan = generateMealPlan(
    profile.daily_calories as number,
    profile.diet_type as string,
    isVegetarian
  );

  // Update or insert
  const existingPlan = await c.env.DB.prepare(`
    SELECT id FROM diet_plans 
    WHERE health_profile_id = ? AND user_id = ?
  `).bind(profileId, user.id).first();

  let planId: number;
  if (existingPlan) {
    await c.env.DB.prepare(`
      UPDATE diet_plans SET plan_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(plan), existingPlan.id).run();
    planId = existingPlan.id as number;
  } else {
    const result = await c.env.DB.prepare(`
      INSERT INTO diet_plans (user_id, health_profile_id, plan_data)
      VALUES (?, ?, ?)
    `).bind(user.id, profileId, JSON.stringify(plan)).run();
    planId = result.meta.last_row_id as number;
  }

  return c.json({
    id: planId,
    profile,
    plan,
  });
});

export default app;
