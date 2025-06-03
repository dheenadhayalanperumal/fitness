"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormError } from "@/components/form-error"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register, loading, error, clearError } = useAuth()
  const router = useRouter()

  // Clear errors when switching between login and signup
  useEffect(() => {
    setFormErrors({})
    clearError()
  }, [isLogin, clearError])

  // Handle input changes and clear field-specific errors
  const handleInputChange = (field: string, value: string) => {
    // Clear field-specific error when user types
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Update the field value
    switch (field) {
      case "name":
        setName(value)
        break
      case "email":
        setEmail(value)
        break
      case "password":
        setPassword(value)
        break
    }
  }

  // Map API error to form field
  useEffect(() => {
    if (error) {
      // Handle specific error types
      if (error.code === "DUPLICATE_EMAIL") {
        setFormErrors((prev) => ({
          ...prev,
          email: "An account already exists with this email address. Please try logging in instead.",
        }))
      } else if (error.code === "AUTH_ERROR" && error.field === "password") {
        setFormErrors((prev) => ({
          ...prev,
          password: "Incorrect password. Please try again or use 'Forgot Password' if you need to reset it.",
        }))
      } else if (error.code === "AUTH_ERROR" && error.field === "email") {
        setFormErrors((prev) => ({
          ...prev,
          email: "No account found with this email address. Please check your email or create an account.",
        }))
      } else if (error.code === "VALIDATION_ERROR") {
        // Handle validation errors
        if (error.field) {
          setFormErrors((prev) => ({
            ...prev,
            [error.field]: error.message,
          }))
        } else {
          setFormErrors((prev) => ({
            ...prev,
            general: error.message,
          }))
        }
      } else if (error.code === "CONNECTION_ERROR") {
        setFormErrors((prev) => ({
          ...prev,
          general: "Unable to connect to the server. Please check your internet connection and try again.",
        }))
      } else if (error.field) {
        // Handle other field-specific errors
        setFormErrors((prev) => ({
          ...prev,
          [error.field]: error.message,
        }))
      } else {
        // Handle general errors
        setFormErrors((prev) => ({
          ...prev,
          general: error.message || "An unexpected error occurred. Please try again.",
        }))
      }
    }
  }, [error])

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!isLogin && (!name || name.trim().length < 2)) {
      errors.name = "Name must be at least 2 characters long"
    }

    if (!email) {
      errors.email = "Please enter your email address"
    } else if (!email.includes("@") || !email.includes(".")) {
      errors.email = "Please enter a valid email address"
    }

    if (!password) {
      errors.password = "Please enter your password"
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setFormErrors({})
    clearError()

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      let success = false

      if (isLogin) {
        success = await login(email, password)
      } else {
        success = await register(name, email, password)
      }

      if (!success) {
        // If not successful, errors will be set in the auth context
        // and mapped to form fields in the useEffect above
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error("Authentication error:", err)
      setFormErrors({
        general: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access your account"
              : "Fill in the information to create your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* General error message at the top of the form */}
            {formErrors.general && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formErrors.general}</AlertDescription>
              </Alert>
            )}

            {/* Name field (signup only) */}
            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="name" className={formErrors.name ? "text-destructive" : ""}>
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Dheena Dhayalan"
                  value={name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className={formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                />
                {formErrors.name && <FormError message={formErrors.name} id="name-error" />}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1">
              <Label htmlFor="email" className={formErrors.email ? "text-destructive" : ""}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="dheena@example.com"
                value={email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className={formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
              {formErrors.email && <FormError message={formErrors.email} id="email-error" />}
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <Label htmlFor="password" className={formErrors.password ? "text-destructive" : ""}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                minLength={6}
                className={formErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!formErrors.password}
                aria-describedby={formErrors.password ? "password-error" : undefined}
              />
              {formErrors.password ? (
                <FormError message={formErrors.password} id="password-error" />
              ) : (
                !isLogin && (
                  <p className="text-xs text-muted-foreground mt-1">Password must be at least 6 characters long</p>
                )
              )}
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#27AE60] hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#27AE60] hover:bg-[#219653]" disabled={loading || isSubmitting}>
              {(loading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Login" : "Create Account"}
            </Button>
            <div className="text-center text-sm">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-[#27AE60] hover:underline"
                    onClick={() => {
                      setIsLogin(false)
                      clearError()
                      setFormErrors({})
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-[#27AE60] hover:underline"
                    onClick={() => {
                      setIsLogin(true)
                      clearError()
                      setFormErrors({})
                    }}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
