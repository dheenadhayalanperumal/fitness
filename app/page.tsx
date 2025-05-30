"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, Dumbbell, Droplets, Utensils, Weight, Info, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useFitness } from "@/context/fitness-context"
import { BottomNav } from "@/components/bottom-nav"
import { StepTrackingWidget } from "@/components/step-tracking-widget"
import ProtectedRoute from "@/components/protected-route"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="hidden md:flex">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Track your daily fitness goals and progress</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="hidden md:block">
                  <Link href="/settings">
                    <Button variant="secondary">Settings</Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Main tracking widgets */}
              <div className="md:col-span-2 lg:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <Link href="/steps" className="block group">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center">
                          <Activity className="h-4 w-4 mr-1 text-green-500" />
                          Steps
                        </span>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{todaySteps.toLocaleString()}</div>
                      <div className="relative pt-2">
                        <Progress value={stepsProgress} className="h-2" />
                        <div className="absolute -top-1 transition-all" style={{ left: `${Math.min(stepsProgress, 100)}%` }}>
                          <div className="relative -ml-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-4 w-4 rounded-full bg-primary" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{Math.round(stepsProgress)}% completed</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-1 text-xs">
                        {Math.round(stepsProgress)}% of {goals.steps.toLocaleString()}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/water" className="block group">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center">
                          <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                          Water
                        </span>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{todayWaterTotal.toFixed(1)}L</div>
                      <div className="relative pt-2">
                        <Progress value={waterProgress} className="h-2" />
                        <div className="absolute -top-1 transition-all" style={{ left: `${Math.min(waterProgress, 100)}%` }}>
                          <div className="relative -ml-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-4 w-4 rounded-full bg-primary" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{Math.round(waterProgress)}% completed</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-1 text-xs">
                        {Math.round(waterProgress)}% of {goals.water}L
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/diet" className="block group">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center">
                          <Utensils className="h-4 w-4 mr-1 text-orange-500" />
                          Calories
                        </span>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{todayCalories.toLocaleString()}</div>
                      <div className="relative pt-2">
                        <Progress value={caloriesProgress} className="h-2" />
                        <div className="absolute -top-1 transition-all" style={{ left: `${Math.min(caloriesProgress, 100)}%` }}>
                          <div className="relative -ml-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-4 w-4 rounded-full bg-primary" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{Math.round(caloriesProgress)}% completed</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-1 text-xs">
                        {Math.round(caloriesProgress)}% of {goals.calories.toLocaleString()}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/weight" className="block group">
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center">
                          <Weight className="h-4 w-4 mr-1 text-purple-500" />
                          Weight
                        </span>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{currentWeight} kg</div>
                      <div className="flex items-center justify-between mt-2">
                        <CardDescription className="text-xs">Goal: {goals.weight} kg</CardDescription>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CardDescription className="text-xs cursor-help">
                                {currentWeight > goals.weight ? "To lose" : "To gain"}: {Math.abs(currentWeight - goals.weight).toFixed(1)} kg
                              </CardDescription>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Distance to your target weight</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Step tracking widget */}
              <div className="md:col-span-1 lg:row-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Step Tracking</CardTitle>
                    <CardDescription>Real-time step counting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StepTrackingWidget />
                  </CardContent>
                </Card>
              </div>

              {/* Weekly activity chart */}
              <Card className="md:col-span-1 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Weekly Activity</CardTitle>
                    <CardDescription>Your step count for the past week</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Each bar represents your daily steps compared to your goal</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-end justify-between gap-2">
                    {weeklySteps.map((value, i) => {
                      const percentage = Math.min(Math.round((value / goals.steps) * 100), 100)
                      const date = new Date()
                      date.setDate(date.getDate() - 6 + i)
                      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
                      
                      return (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative w-full cursor-pointer">
                                <div
                                  className="absolute bottom-0 w-full rounded-md bg-[#27AE60] transition-all hover:bg-[#219653]"
                                  style={{ height: `${percentage}%` }}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-center">
                                <p className="font-semibold">{value.toLocaleString()} steps</p>
                                <p className="text-xs text-muted-foreground">{dayName}</p>
                                <p className="text-xs text-muted-foreground">{percentage}% of goal</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/steps">
                      <Button variant="outline" className="w-full">
                        <Activity className="mr-2 h-4 w-4" />
                        Track Steps
                      </Button>
                    </Link>
                    <Link href="/water">
                      <Button variant="outline" className="w-full">
                        <Droplets className="mr-2 h-4 w-4" />
                        Add Water
                      </Button>
                    </Link>
                    <Link href="/diet">
                      <Button variant="outline" className="w-full">
                        <Utensils className="mr-2 h-4 w-4" />
                        Log Meal
                      </Button>
                    </Link>
                    <Link href="/weight">
                      <Button variant="outline" className="w-full">
                        <Weight className="mr-2 h-4 w-4" />
                        Update Weight
                      </Button>
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
