export interface ChatMessage {
  id: string;
  type: "user" | "bot";
  message: string;
  timestamp: Date;
}

const BOT_RESPONSES = {
  greeting: [
    "Hello! 👋 I'm Lally, your NutriPlan Assistant. I'm here to help you with nutrition advice, diet tips, and health suggestions. What would you like to know?",
    "Hi there! I'm Lally! Welcome to NutriPlan. I can help you with personalized nutrition advice, meal planning tips, and health guidance. How can I assist you?",
  ],
  name: [
    "I'm Lally, your nutrition assistant! Nice to meet you. I'm here to help with diet plans, nutrition advice, and health tips. What can I help you with today?",
    "My name is Lally! 😊 I'm your AI nutritionist here to guide you on your health journey. How can I assist you?",
    "I'm Lally, your nutrition bot! I'm excited to help you achieve your health goals. What would you like to know?",
  ],
  diet: [
    "For a balanced diet, aim to include proteins, carbohydrates, and healthy fats in each meal. Indian cuisine has many healthy options like dal, roti, and vegetables!",
    "Consider eating more whole grains, legumes, and seasonal vegetables. They're nutritious and great for Indian meal planning.",
    "Hydration is key! Drink at least 2-3 liters of water daily. You can also include herbal teas and fresh juices.",
  ],
  weight_loss: [
    "For weight loss: Create a calorie deficit by eating less than your daily requirement. Focus on high-protein foods, vegetables, and whole grains.",
    "Include Indian superfoods like moong dal, chana, and leafy greens. They're high in protein and fiber.",
    "Try to incorporate more physical activity - even 30 minutes of daily walking can help significantly!",
  ],
  weight_gain: [
    "For healthy weight gain: Eat calorie-dense foods like nuts, seeds, whole milk, and ghee in moderation.",
    "Include protein-rich foods like paneer, eggs, dairy, and legumes to build muscle mass.",
    "Eat 5-6 smaller meals throughout the day rather than 3 large meals.",
  ],
  exercise: [
    "Combine cardio and strength training for best results. 150 minutes of moderate cardio + 2 days of strength training per week is ideal.",
    "Indian yoga and pranayama are excellent for overall wellness! Even 20 minutes daily can make a difference.",
    "Start slowly if you're new to exercise. Consistency matters more than intensity!",
  ],
  vegetables: [
    "Seasonal Indian vegetables are your best bet: spinach, broccoli, carrots, bell peppers, tomatoes, and onions are all nutritious.",
    "Green leafy vegetables like spinach and kale are packed with iron, calcium, and vitamins. Add them to your daily meals!",
    "Swap white vegetables with colorful ones for more nutrients. Different colors mean different health benefits!",
  ],
  default: [
    "That's a great question! To give you better advice, I'd recommend checking your personalized meal plan on the dashboard.",
    "I'm here to help! Feel free to ask about nutrition, diet plans, exercise, or any health-related questions.",
    "Is there anything specific about your dietary goals or health journey you'd like to discuss?",
  ],
};

function findBestResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();

  if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    return BOT_RESPONSES.greeting[Math.floor(Math.random() * BOT_RESPONSES.greeting.length)];
  }

  if (
    message.includes("what is your name") ||
    message.includes("what's your name") ||
    message.includes("who are you") ||
    message.includes("your name") ||
    message.includes("called") ||
    message.includes("my name is lally")
  ) {
    return BOT_RESPONSES.name[Math.floor(Math.random() * BOT_RESPONSES.name.length)];
  }

  if (message.includes("weight loss") || message.includes("lose weight")) {
    return BOT_RESPONSES.weight_loss[Math.floor(Math.random() * BOT_RESPONSES.weight_loss.length)];
  }

  if (message.includes("weight gain") || message.includes("gain weight") || message.includes("bulk")) {
    return BOT_RESPONSES.weight_gain[Math.floor(Math.random() * BOT_RESPONSES.weight_gain.length)];
  }

  if (
    message.includes("exercise") ||
    message.includes("workout") ||
    message.includes("fitness") ||
    message.includes("activity")
  ) {
    return BOT_RESPONSES.exercise[Math.floor(Math.random() * BOT_RESPONSES.exercise.length)];
  }

  if (
    message.includes("vegetable") ||
    message.includes("vegetables") ||
    message.includes("greens") ||
    message.includes("leafy")
  ) {
    return BOT_RESPONSES.vegetables[Math.floor(Math.random() * BOT_RESPONSES.vegetables.length)];
  }

  if (
    message.includes("diet") ||
    message.includes("nutrition") ||
    message.includes("food") ||
    message.includes("eat") ||
    message.includes("meal")
  ) {
    return BOT_RESPONSES.diet[Math.floor(Math.random() * BOT_RESPONSES.diet.length)];
  }

  return BOT_RESPONSES.default[Math.floor(Math.random() * BOT_RESPONSES.default.length)];
}

export function generateBotResponse(userMessage: string): string {
  // Simulate thinking time
  return findBestResponse(userMessage);
}

export function getChatHistory(userId: string): ChatMessage[] {
  const history = localStorage.getItem(`chat-${userId}`);
  return history ? JSON.parse(history) : [];
}

export function saveChatMessage(userId: string, message: ChatMessage): void {
  const history = getChatHistory(userId);
  history.push(message);
  // Keep only last 50 messages
  if (history.length > 50) {
    history.shift();
  }
  localStorage.setItem(`chat-${userId}`, JSON.stringify(history));
}

export function clearChatHistory(userId: string): void {
  localStorage.removeItem(`chat-${userId}`);
}
