"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, Dumbbell, Droplets, Utensils, Weight } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useFitness } from "@/context/fitness-context"
import { BottomNav } from "@/components/bottom-nav"
import { StepTrackingWidget } from "@/components/step-tracking-widget"
import ProtectedRoute from "@/components/protected-route"

export default function HomePage() {
  const router = useRouter()
  const {
    profile,
    goals,
    todaySteps,
    todayWaterTotal,
    todayCalories,
    dataLoaded,
    currentWeight,
    workouts,
    getWeeklyStepCount,
    meals,
  } = useFitness()

  const weeklySteps = getWeeklyStepCount()

  // Redirect to onboarding if profile is not set up
  useEffect(() => {
    if (dataLoaded && (!profile.name || profile.name === "John Doe")) {
      router.push("/onboarding")
    }
  }, [profile, router, dataLoaded])

  // Calculate progress percentages
  const stepsProgress = Math.min(100, (todaySteps / goals.steps) * 100)
  const waterProgress = Math.min(100, (todayWaterTotal / goals.water) * 100)
  const caloriesProgress = Math.min(100, (todayCalories / goals.calories) * 100)

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
        <main className="flex-1">
          <div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">Hello, {profile.name?.split(" ")[0] || "there"}!</h1>
                <p className="text-muted-foreground">Here's your daily progress</p>
              </div>
              <div className="hidden md:block">
                <Link href="/settings">
                  <button className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-sm font-medium">
                    Settings
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Main tracking widgets */}
              <div className="md:col-span-2 lg:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <Link href="/steps" className="block">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Activity className="h-4 w-4 mr-1 text-green-500" />
                        Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{todaySteps.toLocaleString()}</div>
                      <Progress value={stepsProgress} className="h-2 mt-2" />
                      <CardDescription className="mt-1 text-xs">
                        {Math.round(stepsProgress)}% of {goals.steps.toLocaleString()}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/water" className="block">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                        Water
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{todayWaterTotal.toFixed(1)}L</div>
                      <Progress value={waterProgress} className="h-2 mt-2" />
                      <CardDescription className="mt-1 text-xs">
                        {Math.round(waterProgress)}% of {goals.water}L
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/diet" className="block">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Utensils className="h-4 w-4 mr-1 text-orange-500" />
                        Calories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{todayCalories.toLocaleString()}</div>
                      <Progress value={caloriesProgress} className="h-2 mt-2" />
                      <CardDescription className="mt-1 text-xs">
                        {Math.round(caloriesProgress)}% of {goals.calories.toLocaleString()}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/weight" className="block">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Weight className="h-4 w-4 mr-1 text-purple-500" />
                        Weight
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{currentWeight} kg</div>
                      <CardDescription className="mt-1 text-xs">Goal: {goals.weight} kg</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Step tracking widget */}
              <div className="md:col-span-1 lg:row-span-2">
                <StepTrackingWidget />
              </div>

              {/* Weekly activity chart */}
              <Card className="md:col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Your step count for the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-end justify-between gap-2">
                    {weeklySteps.map((value, i) => {
                      const percentage = Math.min(Math.round((value / goals.steps) * 100), 100)
                      return (
                        <div key={i} className="relative w-full">
                          <div
                            className="absolute bottom-0 w-full rounded-md bg-[#27AE60] transition-all"
                            style={{ height: `${percentage}%` }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() - 6 + i)
                      return <div key={i}>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Log your activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Link href="/diet">
                      <button className="w-full h-20 sm:h-24 rounded-lg bg-secondary hover:bg-secondary/80 flex flex-col items-center justify-center gap-2 transition-colors">
                        <Utensils className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                        <span className="text-xs sm:text-sm font-medium">Log Meal</span>
                      </button>
                    </Link>
                    <Link href="/workout">
                      <button className="w-full h-20 sm:h-24 rounded-lg bg-secondary hover:bg-secondary/80 flex flex-col items-center justify-center gap-2 transition-colors">
                        <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                        <span className="text-xs sm:text-sm font-medium">Log Workout</span>
                      </button>
                    </Link>
                    <Link href="/water">
                      <button className="w-full h-20 sm:h-24 rounded-lg bg-secondary hover:bg-secondary/80 flex flex-col items-center justify-center gap-2 transition-colors">
                        <Droplets className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                        <span className="text-xs sm:text-sm font-medium">Log Water</span>
                      </button>
                    </Link>
                    <Link href="/weight">
                      <button className="w-full h-20 sm:h-24 rounded-lg bg-secondary hover:bg-secondary/80 flex flex-col items-center justify-center gap-2 transition-colors">
                        <Weight className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                        <span className="text-xs sm:text-sm font-medium">Log Weight</span>
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
