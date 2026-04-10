import React, { ReactNode, useEffect, useState } from "react";
import { useAuth as useRealAuth } from "@getmocha/users-service/react";
import { getDevAuthToken, setDevAuthToken, clearDevAuthToken, isDevelopmentMode } from "@/dev-auth";
import type { DevUser } from "@/dev-auth";

interface AuthContextType {
  user: DevUser | null;
  isPending: boolean;
  redirectToLogin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const realAuth = useRealAuth();
  const [devUser, setDevUser] = useState<DevUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    if (isDevelopmentMode()) {
      // Dev mode - use mock auth
      const storedUser = getDevAuthToken();
      setDevUser(storedUser);
      setIsPending(false);
    } else {
      // Production mode - use real auth
      setDevUser(null);
      setIsPending(realAuth.isPending);
    }
  }, [realAuth.isPending]);

  const handleLogin = () => {
    if (isDevelopmentMode()) {
      setDevAuthToken();
      setDevUser(getDevAuthToken());
    } else {
      realAuth.redirectToLogin();
    }
  };

  const handleLogout = async () => {
    if (isDevelopmentMode()) {
      clearDevAuthToken();
      setDevUser(null);
    } else {
      await realAuth.logout();
    }
  };

  const contextValue: AuthContextType = {
    user: isDevelopmentMode() ? devUser : (realAuth.user as DevUser),
    isPending,
    redirectToLogin: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within DevAuthProvider");
  }
  return context;
}
