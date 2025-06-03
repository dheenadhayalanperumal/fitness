"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Droplets, Utensils, Weight, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useFitness } from "@/context/fitness-context"
import { BottomNav } from "@/components/bottom-nav"
import ProtectedRoute from "@/components/protected-route"

export default function HomePage() {
  const router = useRouter()
  const {
    profile,
    goals,
    todayWaterTotal,
    todayCalories,
    dataLoaded,
    currentWeight,
  } = useFitness()

  // Redirect to onboarding if profile is not set up
  useEffect(() => {
    if (dataLoaded && (!profile.name || profile.name === "John Doe")) {
      router.push("/onboarding")
    }
  }, [profile, router, dataLoaded])

  // Calculate progress percentages
  const waterProgress = Math.min(100, (todayWaterTotal / goals.water) * 100)
  const caloriesProgress = Math.min(100, (todayCalories / goals.calories) * 100)

  return (
    <ProtectedRoute>
      <div className="container pb-20">
        <header className="py-6">
          <h1 className="text-2xl font-bold">Welcome back, {profile.name}!</h1>
          <p className="text-muted-foreground">Here's your daily progress</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Water Tracking */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Water
                </div>
              </CardTitle>
              <Link href="/water">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add water</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <div className="text-2xl font-bold">{todayWaterTotal.toFixed(1)}L</div>
                <CardDescription className="mb-1">of {goals.water}L goal</CardDescription>
              </div>
              <Progress value={waterProgress} className="h-2" />
            </CardContent>
          </Card>

          {/* Calories Tracking */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Calories
                </div>
              </CardTitle>
              <Link href="/meals">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add meal</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <div className="text-2xl font-bold">{todayCalories.toLocaleString()}</div>
                <CardDescription className="mb-1">of {goals.calories.toLocaleString()} goal</CardDescription>
              </div>
              <Progress value={caloriesProgress} className="h-2" />
            </CardContent>
          </Card>

          {/* Weight Tracking */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Weight
                </div>
              </CardTitle>
              <Link href="/weight">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add weight</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <div className="text-2xl font-bold">{currentWeight}kg</div>
                <CardDescription className="mb-1">Target: {goals.weight}kg</CardDescription>
              </div>
              <Progress
                value={Math.min(100, (currentWeight / goals.weight) * 100)}
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
