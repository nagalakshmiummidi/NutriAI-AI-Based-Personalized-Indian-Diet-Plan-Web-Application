
CREATE TABLE health_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  activity_level TEXT NOT NULL,
  goal TEXT NOT NULL,
  dietary_preference TEXT NOT NULL,
  health_condition TEXT NOT NULL,
  bmi REAL NOT NULL,
  bmi_category TEXT NOT NULL,
  bmr REAL NOT NULL,
  daily_calories REAL NOT NULL,
  diet_type TEXT NOT NULL,
  protein_grams REAL NOT NULL,
  carbs_grams REAL NOT NULL,
  fats_grams REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_profiles_user_id ON health_profiles(user_id);
