"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { setCookie, getCookie, deleteCookie } from "cookies-next"

// Define user type
type User = {
  id: string
  email: string
  name: string
  hasCompletedOnboarding?: boolean
}

// Enhanced error type with field information
type AuthError = {
  message: string
  code?: string
  field?: string
}

// Define auth context type
type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  error: AuthError | null
  clearError: () => void
  setOnboardingCompleted: (completed: boolean) => void
  hasCompletedOnboarding: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const router = useRouter()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = getCookie("auth_token")
        const storedUser = getCookie("auth_user")
        const onboardingCompleted = getCookie("onboarding_completed") === "true"

        if (storedToken && storedUser) {
          setToken(storedToken as string)
          setUser(JSON.parse(storedUser as string))
          setHasCompletedOnboarding(onboardingCompleted)

          // Add this check to redirect users if they're already logged in
          const currentPath = window.location.pathname
          if ((currentPath === "/login" || currentPath === "/signup") && onboardingCompleted) {
            router.push("/")
          } else if ((currentPath === "/login" || currentPath === "/signup") && !onboardingCompleted) {
            router.push("/onboarding")
          }
        }
      } catch (err) {
        console.error("Authentication error:", err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Clear error
  const clearError = () => {
    setError(null)
  }

  // Set onboarding completed status
  const setOnboardingCompleted = (completed: boolean) => {
    setHasCompletedOnboarding(completed)
    setCookie("onboarding_completed", completed.toString())

    if (completed) {
      router.push("/") // Redirect to dashboard after onboarding completion
    }
  }

  // Login function with enhanced error handling
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      console.log("Attempting login for:", email)

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Login failed:", data)

        // Enhanced error handling with specific error codes and fields
        if (response.status === 401) {
          // Determine if it's an email or password issue
          if (data.message && data.message.toLowerCase().includes("email")) {
            setError({
              message: "Email not found. Please check your email or create an account.",
              code: "AUTH_ERROR",
              field: "email",
            })
          } else {
            setError({
              message: "Invalid password. Please try again.",
              code: "AUTH_ERROR",
              field: "password",
            })
          }
        } else {
          setError({
            message: data.message || "Invalid email or password",
            code: data.code || "AUTH_ERROR",
            field: data.field,
          })
        }

        return false
      }

      console.log("Login successful")

      // Save user data and token
      setUser(data.user)
      setToken(data.token)

      // Store in cookies
      setCookie("auth_token", data.token)
      setCookie("auth_user", JSON.stringify(data.user))

      // Check if user has completed onboarding
      const onboardingCompleted = data.user.hasCompletedOnboarding || false
      setHasCompletedOnboarding(onboardingCompleted)
      setCookie("onboarding_completed", onboardingCompleted.toString())

      // Conditional navigation based on onboarding status
      if (onboardingCompleted) {
        router.push("/") // Go to dashboard if onboarding is completed
      } else {
        router.push("/onboarding") // Go to onboarding if not completed
      }

      return true
    } catch (err) {
      console.error("Login error:", err)
      setError({
        message: "An error occurred during login. Please try again.",
        code: "NETWORK_ERROR",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Register function with enhanced error handling
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      console.log("Attempting registration for:", email)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Registration failed:", data)

        // Enhanced error handling for registration-specific errors
        if (response.status === 409 || data.code === "DUPLICATE_KEY" || data.code === "DUPLICATE_EMAIL") {
          setError({
            message: "This email address is already registered. Please use a different email or try logging in.",
            code: "DUPLICATE_EMAIL",
            field: "email",
          })
        } else if (data.field) {
          // Field-specific validation errors
          setError({
            message: data.message || "Registration failed",
            code: data.code || "REGISTRATION_ERROR",
            field: data.field,
          })
        } else {
          setError({
            message: data.message || "Registration failed",
            code: data.code || "REGISTRATION_ERROR",
          })
        }

        return false
      }

      console.log("Registration successful")

      // Save user data and token
      setUser(data.user)
      setToken(data.token)

      // Store in cookies
      setCookie("auth_token", data.token)
      setCookie("auth_user", JSON.stringify(data.user))

      // Explicitly set onboarding status to false for new users
      setHasCompletedOnboarding(false)
      setCookie("onboarding_completed", "false")

      // Always redirect to onboarding for new users - use replace instead of push for a cleaner navigation
      setTimeout(() => {
        window.location.href = "/onboarding"
      }, 100)

      return true
    } catch (err) {
      console.error("Registration error:", err)

      setError({
        message: "An error occurred during registration. Please try again.",
        code: "NETWORK_ERROR",
      })

      return false
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    console.log("Logging out user")

    // Clear state
    setUser(null)
    setToken(null)
    setHasCompletedOnboarding(false)
    clearError()

    // Clear cookies
    deleteCookie("auth_token")
    deleteCookie("auth_user")
    deleteCookie("onboarding_completed")

    // Clear any localStorage items related to the user
    if (typeof window !== "undefined") {
      localStorage.removeItem("fitness_profile")
      localStorage.removeItem("fitness_goals")
      localStorage.removeItem("fitness_settings")
      localStorage.removeItem("fitness_steps")
      localStorage.removeItem("fitness_water")
      localStorage.removeItem("fitness_meals")
      localStorage.removeItem("fitness_weight")
      localStorage.removeItem("fitness_workouts")
      localStorage.removeItem("fitness_exercises")
    }

    // Redirect to login page
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        error,
        clearError,
        setOnboardingCompleted,
        hasCompletedOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
