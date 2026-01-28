"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "moderator";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        // We need to define the shape of the decoded token from your backend JWT util
        const decodedToken = jwtDecode<{
          userId: string;
          iat: number;
          exp: number;
        }>(storedToken);

        if (decodedToken.exp * 1000 > Date.now()) {
          // Since the basic token only has the ID, we'd ideally fetch the user profile
          // For simplicity now, we'll just store the ID and assume a fetch happens elsewhere
          // or we decode a more detailed token. Let's assume a more detailed token for now.
          const decodedUser = jwtDecode<User>(storedToken);
          setUser(decodedUser);
          setToken(storedToken);
        } else {
          localStorage.removeItem("authToken");
        }
      }
    } catch (e) {
      console.error("Failed to process token on load:", e);
      localStorage.removeItem("authToken");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = (newToken: string) => {
    localStorage.setItem("authToken", newToken);
    const decodedUser = jwtDecode<User>(newToken);
    setUser(decodedUser);
    setToken(newToken);
    setError(null);

    if (decodedUser.role === "admin" || decodedUser.role === "moderator") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`;

      // Debug: Log the API URL being used
      console.log("🔍 Login API URL:", apiUrl);
      console.log(
        "🔍 API Base URL env var:",
        process.env.NEXT_PUBLIC_API_BASE_URL,
      );

      // Check if API URL is configured
      if (
        !process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL === "undefined"
      ) {
        throw new Error(
          "❌ API URL not configured! Set NEXT_PUBLIC_API_BASE_URL in your .env.local file or Vercel environment variables.",
        );
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Server returned non-JSON response. Status: ${response.status}. This might be a CORS or server configuration issue.`,
        );
      }

      const data = await response.json();
      if (!response.ok) {
        // ✅ FIX: Throw the entire 'data' object which contains the message
        throw data;
      }
      handleAuthSuccess(data.data.token);
    } catch (err: any) {
      // Enhanced error message for network errors
      if (err.message?.includes("fetch") || err.name === "TypeError") {
        const detailedError = `Network Error: Cannot connect to API server.\n\nAPI URL: ${process.env.NEXT_PUBLIC_API_BASE_URL}\n\nPossible causes:\n1. NEXT_PUBLIC_API_BASE_URL is not set correctly\n2. Backend server is not running or unreachable\n3. CORS is blocking the request\n\nCheck browser console for more details.`;
        setError(detailedError);
        console.error("❌ Login Network Error:", err);
        throw new Error(detailedError);
      }
      setError(err.message || "An unknown error occurred.");
      throw err;
    }
  };

  const register = async (userData: any) => {
    setError(null);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`;

      // Debug: Log the API URL being used
      console.log("🔍 Register API URL:", apiUrl);

      // Check if API URL is configured
      if (
        !process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL === "undefined"
      ) {
        throw new Error(
          "❌ API URL not configured! Set NEXT_PUBLIC_API_BASE_URL in your .env.local file or Vercel environment variables.",
        );
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Server returned non-JSON response. Status: ${response.status}. This might be a CORS or server configuration issue.`,
        );
      }

      const data = await response.json();
      if (!response.ok) {
        // ✅ FIX: Throw the entire 'data' object, which contains the 'errors' array
        throw data;
      }
      handleAuthSuccess(data.data.token);
    } catch (err: any) {
      // Enhanced error message for network errors
      if (err.message?.includes("fetch") || err.name === "TypeError") {
        const detailedError = `Network Error: Cannot connect to API server.\n\nAPI URL: ${process.env.NEXT_PUBLIC_API_BASE_URL}\n\nPossible causes:\n1. NEXT_PUBLIC_API_BASE_URL is not set correctly\n2. Backend server is not running or unreachable\n3. CORS is blocking the request`;
        setError(detailedError);
        console.error("❌ Register Network Error:", err);
        throw new Error(detailedError);
      }
      // Set a generic error message, but re-throw the full error object
      // so the signup page can access the detailed validation 'errors' array.
      setError(err.message || "An unknown error occurred.");
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setToken(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, error, login, register, logout }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
