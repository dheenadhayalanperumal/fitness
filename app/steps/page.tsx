"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderSyncIcon as Sync,
  Play,
  Pause,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { useFitness } from "@/context/fitness-context"
import { calculateCaloriesBurned, calculateDistanceFromSteps, formatDate, getDayName } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"
import { useAccurateStepCounter } from "@/hooks/use-accurate-step-counter"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function StepsPage() {
  const { todaySteps, goals, steps, addSteps } = useFitness()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("week")
  const [showSettings, setShowSettings] = useState(false)

  // Use our new accurate step counter
  const {
    steps: localSteps,
    isTracking,
    isAvailable,
    isCalibrating,
    sensitivity,
    startTracking,
    stopTracking,
    adjustSensitivity,
  } = useAccurateStepCounter({
    onCalibrationComplete: () => {
      toast({
        title: "Calibration Complete",
        description: "Step tracking is now optimized for your movement pattern",
      })
    },
  })

  // Sync steps with fitness context periodically
  useEffect(() => {
    if (!isTracking || localSteps === 0) return

    const syncInterval = setInterval(() => {
      if (localSteps > 0) {
        addSteps(localSteps)
        toast({
          title: "Steps Synced",
          description: `${localSteps} steps added to your daily total.`,
        })
      }
    }, 30000) // Sync every 30 seconds

    return () => clearInterval(syncInterval)
  }, [isTracking, localSteps, addSteps])

  // Sync remaining steps when stopping tracking
  useEffect(() => {
    if (!isTracking && localSteps > 0) {
      addSteps(localSteps)
    }
  }, [isTracking, localSteps, addSteps])

  const stepPercentage = Math.min(Math.round(((todaySteps + localSteps) / goals.steps) * 100), 100)
  const caloriesBurned = calculateCaloriesBurned(todaySteps + localSteps)
  const distanceKm = calculateDistanceFromSteps(todaySteps + localSteps)

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 1)
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking()
      toast({
        title: "Step Tracking Stopped",
        description: isCalibrating ? "Calibration canceled" : "Your steps have been saved.",
      })
    } else {
      startTracking()
    }
  }

  // Get weekly steps data
  const getWeeklySteps = () => {
    const today = new Date()
    const weeklySteps = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      const entry = steps.find((step) => step.date === dateString)
      weeklySteps.push(entry?.count || 0)
    }

    // Add today's local steps to the last day
    if (weeklySteps.length > 0) {
      weeklySteps[weeklySteps.length - 1] += localSteps
    }

    return weeklySteps
  }

  const weeklySteps = getWeeklySteps()
  const weeklyTotal = weeklySteps.reduce((sum, count) => sum + count, 0)
  const weeklyAverage = Math.round(weeklyTotal / 7)
  const weeklyDistance = calculateDistanceFromSteps(weeklyTotal)
  const weeklyCalories = calculateCaloriesBurned(weeklyTotal)

  // Simulate hourly step data
  const hourlySteps = [10, 25, 45, 65, 30, 15, 5, 0, 0, 20, 40, 60, 80, 70, 50, 30, 20, 10, 5, 0, 0, 0, 0, 0]

  // Simulate monthly step data
  const monthlySteps = Array.from({ length: 30 }).map(() => Math.floor(Math.random() * 100))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">Step Tracker</h1>
          <div className="ml-auto flex items-center gap-2">
            {isAvailable && (
              <Button variant={isTracking ? "destructive" : "default"} size="sm" onClick={handleToggleTracking}>
                {isTracking ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    {isCalibrating ? "Stop Calibrating" : "Stop Tracking"}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Tracking
                  </>
                )}
              </Button>
            )}

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Step Tracking Settings</DialogTitle>
                  <DialogDescription>Adjust the sensitivity to match your walking style</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Sensitivity</span>
                      <span className="text-sm text-muted-foreground">{sensitivity.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[sensitivity]}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      onValueChange={(value) => adjustSensitivity(value[0])}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Less Sensitive</span>
                      <span className="text-xs text-muted-foreground">More Sensitive</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Tips for accurate step tracking:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Keep your phone in your pocket or hand while walking</li>
                      <li>Walk naturally at a consistent pace during calibration</li>
                      <li>Increase sensitivity if steps aren't being counted</li>
                      <li>Decrease sensitivity if phantom steps are detected</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Simulate syncing with health app
                toast({
                  title: "Synced with health app",
                  description: "Your steps have been updated from your health app.",
                })
                // Add random steps
                const randomSteps = Math.floor(Math.random() * 1000) + 500
                addSteps(randomSteps)
              }}
            >
              <Sync className="h-5 w-5" />
              <span className="sr-only">Sync</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Previous</span>
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">{formatDate(selectedDate)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDay}
                disabled={new Date(selectedDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)}
              >
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Today's Steps</CardTitle>
              <CardDescription>Your step count for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-8 border-[#27AE60]/20">
                  <svg className="absolute h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="stroke-[#27AE60] stroke-[8px] fill-none"
                      cx="50"
                      cy="50"
                      r="46"
                      strokeDasharray="289.02652413026095"
                      strokeDashoffset={`${289.02652413026095 - (289.02652413026095 * stepPercentage) / 100}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-[#27AE60]">
                      {(todaySteps + localSteps).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">of {goals.steps.toLocaleString()} goal</div>
                    {isTracking && (
                      <div className="text-xs text-green-600 animate-pulse mt-1">
                        {isCalibrating ? "Calibrating..." : `+${localSteps} steps (tracking)`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{distanceKm}</div>
                    <div className="text-xs text-muted-foreground">km</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{caloriesBurned}</div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stepPercentage}%</div>
                    <div className="text-xs text-muted-foreground">of goal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Tabs defaultValue="week" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="day" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Steps</CardTitle>
                  <CardDescription>Your step count by hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-2">
                    {hourlySteps.map((value, i) => (
                      <div key={i} className="relative w-full">
                        <div
                          className="absolute bottom-0 w-full rounded-md bg-[#27AE60] transition-all"
                          style={{ height: `${value}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <div>12AM</div>
                    <div>6AM</div>
                    <div>12PM</div>
                    <div>6PM</div>
                    <div>12AM</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="week" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Steps</CardTitle>
                  <CardDescription>Your step count for the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-2">
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
                      return <div key={i}>{getDayName(date.toISOString())}</div>
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Summary</CardTitle>
                  <CardDescription>Your step statistics for this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Total Steps</div>
                      <div className="text-2xl font-bold">{weeklyTotal.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Daily Average</div>
                      <div className="text-2xl font-bold">{weeklyAverage.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Total Distance</div>
                      <div className="text-2xl font-bold">{weeklyDistance.toFixed(1)} km</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Calories Burned</div>
                      <div className="text-2xl font-bold">{weeklyCalories.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="month" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Steps</CardTitle>
                  <CardDescription>Your step count for the past month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-1">
                    {monthlySteps.map((value, i) => (
                      <div key={i} className="relative w-full">
                        <div
                          className="absolute bottom-0 w-full rounded-sm bg-[#27AE60] transition-all"
                          style={{ height: `${value}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <div>1</div>
                    <div>10</div>
                    <div>20</div>
                    <div>30</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
