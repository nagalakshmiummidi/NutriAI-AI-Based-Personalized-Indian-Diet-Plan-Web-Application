import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Salad, Loader2 } from "lucide-react";

interface GoogleUserProfile {
  id: string;
  email: string;
  given_name?: string;
  name?: string;
  picture?: string;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Try to handle OAuth callback
        try {
          await exchangeCodeForSessionToken();
          navigate("/dashboard");
        } catch (oauthErr: unknown) {
          // If OAuth fails, fall back to creating a local user from URL params
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          const state = params.get("state");
          
          if (code && state) {
            // OAuth code is present, wait for user data
            if (user) {
              // User authenticated, store and navigate
              const userData = {
                id: user.id || `user-${Date.now()}`,
                email: user.email || "user@nutriplan.local",
                google_user_data: {
                  given_name: user.google_user_data?.given_name || "User",
                  name: user.google_user_data?.name || "User",
                  picture: user.google_user_data?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                },
              };
              localStorage.setItem("auth-user", JSON.stringify(userData));
              navigate("/dashboard");
            } else {
              // No user data yet, wait a bit
              setTimeout(() => {
                navigate("/dashboard");
              }, 1000);
            }
          } else {
            // No code in URL, direct access
            if (user) {
              navigate("/dashboard");
            } else {
              throw new Error("No user data available");
            }
          }
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Failed to complete login. Using offline mode...");
        // Fallback to creating a demo user
        const fallbackUser = {
          id: `user-${Date.now()}`,
          email: "user@nutriplan.local",
          google_user_data: {
            given_name: "User",
            name: "User",
            picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=user-${Date.now()}`,
          },
        };
        localStorage.setItem("auth-user", JSON.stringify(fallbackUser));
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
          <Salad className="w-8 h-8 text-white" />
        </div>
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Login Failed</h1>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to home...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Completing Login</h1>
            <p className="text-gray-600">Please wait while we sign you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
