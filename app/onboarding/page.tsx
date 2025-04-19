"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFitness } from "@/context/fitness-context"
import { useAuth } from "@/context/auth-context"
import { NotificationConfirmation } from "@/components/notification-confirmation"

export default function OnboardingPage() {
  const router = useRouter()
  const { updateProfile, updateGoals, enableNotifications, profile } = useFitness()
  const { setOnboardingCompleted, user, loading } = useAuth()

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!loading && !user) {
      router.push("/login")
      return
    }

    // If user is logged in but has already completed onboarding, redirect to dashboard
    if (!loading && user?.hasCompletedOnboarding) {
      router.push("/")
    }
  }, [user, loading, router])

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    mobileNumber: "", // Changed from email to mobileNumber
    gender: "male",
    birthdate: "",
    height: 175,
    weight: 70,
    activityLevel: "moderate",
    goal: "maintain",
  })
  const [showNotificationConfirmation, setShowNotificationConfirmation] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const calculateBMR = () => {
    const age = formData.birthdate ? new Date().getFullYear() - new Date(formData.birthdate).getFullYear() : 30

    // BMR calculation using Mifflin-St Jeor Equation
    if (formData.gender === "male") {
      return 10 * formData.weight + 6.25 * formData.height - 5 * age + 5
    } else {
      return 10 * formData.weight + 6.25 * formData.height - 5 * age - 161
    }
  }

  const calculateTDEE = () => {
    const bmr = calculateBMR()

    // Activity multiplier
    const multipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      active: 1.725, // Hard exercise 6-7 days/week
      veryActive: 1.9, // Very hard exercise & physical job
    }

    return bmr * multipliers[formData.activityLevel as keyof typeof multipliers]
  }

  const calculateCalorieGoal = () => {
    const tdee = calculateTDEE()

    // Adjust based on goal
    switch (formData.goal) {
      case "lose":
        return tdee - 500 // 500 calorie deficit for weight loss
      case "gain":
        return tdee + 500 // 500 calorie surplus for weight gain
      default:
        return tdee // Maintain weight
    }
  }

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      // Final step - save data and handle notifications
      const calorieGoal = Math.round(calculateCalorieGoal() / 50) * 50

      updateProfile({
        name: formData.name,
        mobileNumber: formData.mobileNumber, // Use mobileNumber instead of email
        height: formData.height,
        weight: formData.weight,
        birthdate: formData.birthdate,
        dietPurpose: formData.goal as "lose" | "maintain" | "gain",
      })

      updateGoals({
        calories: calorieGoal,
        steps: 10000, // Default
        water: 2.5, // Default
        sleep: 8, // Default
        weight:
          formData.goal === "lose"
            ? Math.round(formData.weight * 0.9) // 10% weight loss
            : formData.goal === "gain"
              ? Math.round(formData.weight * 1.1) // 10% weight gain
              : formData.weight, // Maintain
      })

      // Enable notifications and show confirmation
      const notificationsEnabled = await enableNotifications()
      if (notificationsEnabled) {
        setShowNotificationConfirmation(true)
      } else {
        // If notifications not enabled, just complete onboarding
        setOnboardingCompleted(true)
      }
    }
  }

  const handleNotificationConfirmationClose = () => {
    setShowNotificationConfirmation(false)
    // Mark onboarding as completed after notification confirmation
    setOnboardingCompleted(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#27AE60]"></div>
      </div>
    )
  }

  const handleEnableNotifications = async () => {
    const granted = await enableNotifications()
    if (granted) {
      setShowNotificationConfirmation(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Fitness Tracker</CardTitle>
          <CardDescription>Let's set up your profile ({step}/4)</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" placeholder="DheenaDhayalan" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="number"
                  placeholder="+91 787 139 139 4"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <RadioGroup
                  id="gender"
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">Date of Birth</Label>
                <Input id="birthdate" type="date" value={formData.birthdate} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) =>
                    handleInputChange({
                      ...e,
                      target: {
                        ...e.target,
                        value: e.target.value,
                        id: "height",
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) =>
                    handleInputChange({
                      ...e,
                      target: {
                        ...e.target,
                        value: e.target.value,
                        id: "weight",
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => handleSelectChange("activityLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="light">Lightly active (1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderately active (3-5 days/week)</SelectItem>
                    <SelectItem value="active">Very active (6-7 days/week)</SelectItem>
                    <SelectItem value="veryActive">Extra active (physical job & training)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Your Goal</Label>
                <Select value={formData.goal} onValueChange={(value) => handleSelectChange("goal", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Your Recommended Daily Values</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Calories:</span>
                    <span className="font-medium">{Math.round(calculateCalorieGoal())} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Water:</span>
                    <span className="font-medium">2.5 L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Steps:</span>
                    <span className="font-medium">10,000 steps</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Enable Notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get reminders for water, activity, and nutrition goals
                </p>
                <Button variant="outline" className="mt-2 w-full" onClick={handleEnableNotifications}>
                  Enable Notifications
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="ml-auto bg-[#27AE60] hover:bg-[#219653] text-white" onClick={handleNext}>
            {step < 4 ? (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Get Started <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {showNotificationConfirmation && (
        <NotificationConfirmation
          onClose={() => {
            setShowNotificationConfirmation(false)
            // Redirect to dashboard after notification confirmation is closed
            setOnboardingCompleted(true)
          }}
        />
      )}
    </div>
  )
}
