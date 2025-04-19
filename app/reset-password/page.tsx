"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormError } from "@/components/form-error"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(true)

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setTokenValid(false)
        setValidating(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}&email=${encodeURIComponent(email)}`)
        const data = await response.json()

        setTokenValid(response.ok)
        if (!response.ok) {
          setError(data.message || "Invalid or expired reset link")
        }
      } catch (err) {
        setTokenValid(false)
        setError("Failed to validate reset token")
        console.error("Token validation error:", err)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token, email])

  const validatePassword = (): boolean => {
    let isValid = true

    if (!password) {
      setPasswordError("Password is required")
      isValid = false
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      isValid = false
    } else {
      setPasswordError(null)
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
      isValid = false
    } else {
      setConfirmPasswordError(null)
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePassword()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to reset password. Please try again.")
        return
      }

      // Success
      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      setError("An error occurred. Please try again later.")
      console.error("Password reset error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Validating reset link...</p>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>The password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "This link is no longer valid. Please request a new password reset link."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full bg-[#27AE60] hover:bg-[#219653]">Request New Reset Link</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Link href="/login" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CardTitle>Create New Password</CardTitle>
          </div>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Your password has been reset successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className={passwordError ? "text-destructive" : ""}>
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (passwordError) validatePassword()
                      }}
                      className={passwordError ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  {passwordError ? (
                    <FormError message={passwordError} />
                  ) : (
                    <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={confirmPasswordError ? "text-destructive" : ""}>
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (confirmPasswordError) validatePassword()
                    }}
                    className={confirmPasswordError ? "border-destructive focus-visible:ring-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {confirmPasswordError && <FormError message={confirmPasswordError} />}
                </div>
              </>
            )}
          </CardContent>

          {!success && (
            <CardFooter>
              <Button type="submit" className="w-full bg-[#27AE60] hover:bg-[#219653]" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  )
}
