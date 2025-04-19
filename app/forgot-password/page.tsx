"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormError } from "@/components/form-error"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError("Email is required")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address")
      return false
    }

    setEmailError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.field === "email") {
          setEmailError(data.message)
        } else {
          setError(data.message || "Failed to send reset email. Please try again.")
        }
        return
      }

      // Success
      setSuccess(true)
    } catch (err) {
      setError("An error occurred. Please try again later.")
      console.error("Password reset request error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Link href="/login" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CardTitle>Reset Password</CardTitle>
          </div>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
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
                  If an account exists with this email, you will receive a password reset link shortly. Please check
                  your email inbox and spam folder.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email" className={emailError ? "text-destructive" : ""}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) validateEmail(e.target.value)
                  }}
                  className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                  disabled={isSubmitting || success}
                />
                {emailError && <FormError message={emailError} />}
              </div>
            )}
          </CardContent>

          {!success && (
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-[#27AE60] hover:bg-[#219653]"
                disabled={isSubmitting || success}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </CardFooter>
          )}

          {success && (
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  )
}
