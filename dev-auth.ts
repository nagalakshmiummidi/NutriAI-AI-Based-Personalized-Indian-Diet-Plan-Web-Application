/**
 * Development Authentication - Mock auth for local testing
 */

export interface DevUser {
  id: string;
  email: string;
  google_user_data?: {
    given_name: string;
    name: string;
    picture: string;
  };
}

const DEMO_USER: DevUser = {
  id: "dev-user-123",
  email: "demo@nutriplan.local",
  google_user_data: {
    given_name: "Demo",
    name: "Demo User",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
  },
};

const DEV_AUTH_KEY = "dev-auth-token";

export function setDevAuthToken() {
  localStorage.setItem(DEV_AUTH_KEY, JSON.stringify(DEMO_USER));
}

export function getDevAuthToken(): DevUser | null {
  const token = localStorage.getItem(DEV_AUTH_KEY);
  return token ? JSON.parse(token) : null;
}

export function clearDevAuthToken() {
  localStorage.removeItem(DEV_AUTH_KEY);
}

export function isDevelopmentMode(): boolean {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
