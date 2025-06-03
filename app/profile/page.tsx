"use client"

import Link from "next/link"
import { ArrowLeft, Award, BarChart3, Calendar, Edit, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useFitness } from "@/context/fitness-context"
import { BottomNav } from "@/components/bottom-nav"

export default function ProfilePage() {
  const { profile, currentWeight, achievements, activityHistory, getWeeklyProgress, weightEntries, calculateBMI } =
    useFitness()

  const weeklyProgress = getWeeklyProgress()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
          <div className="mb-8 flex flex-col items-center justify-center text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
                <AvatarFallback className="text-xl">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#27AE60] text-white hover:bg-[#219653]"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit Profile</span>
              </Button>
            </div>
            <h2 className="mt-4 text-2xl font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-[#27AE60]/10 text-[#27AE60]">
                Fitness Enthusiast
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold">{currentWeight}</div>
                <div className="text-sm text-muted-foreground">Current Weight (kg)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold">{calculateBMI()}</div>
                <div className="text-sm text-muted-foreground">BMI</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold">{profile.height}</div>
                <div className="text-sm text-muted-foreground">Height (cm)</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="stats" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats">
                <BarChart3 className="mr-2 h-4 w-4" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Award className="mr-2 h-4 w-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="history">
                <Calendar className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Progress</CardTitle>
                  <CardDescription>Your progress towards your goals this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-[#2980B9]"></div>
                        <span>Water</span>
                      </div>
                      <div className="text-sm">
                        {weeklyProgress.water.current.toFixed(1)}L / {weeklyProgress.water.goal.toFixed(1)}L
                      </div>
                    </div>
                    <Progress
                      value={Math.min(100, (weeklyProgress.water.current / weeklyProgress.water.goal) * 100)}
                      className="h-2 bg-muted [&>div]:bg-[#2980B9]"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-[#E74C3C]"></div>
                        <span>Workouts</span>
                      </div>
                      <div className="text-sm">
                        {weeklyProgress.workouts.current} / {weeklyProgress.workouts.goal}
                      </div>
                    </div>
                    <Progress
                      value={Math.min(100, (weeklyProgress.workouts.current / weeklyProgress.workouts.goal) * 100)}
                      className="h-2 bg-muted [&>div]:bg-[#E74C3C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-[#F39C12]"></div>
                        <span>Sleep</span>
                      </div>
                      <div className="text-sm">
                        {weeklyProgress.sleep.current}h / {weeklyProgress.sleep.goal}h
                      </div>
                    </div>
                    <Progress
                      value={Math.min(100, (weeklyProgress.sleep.current / weeklyProgress.sleep.goal) * 100)}
                      className="h-2 bg-muted [&>div]:bg-[#F39C12]"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Body Measurements</CardTitle>
                  <CardDescription>Your body measurements over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-end justify-between gap-2">
                    {weightEntries
                      .slice(0, 7)
                      .reverse()
                      .map((entry, i) => {
                        const minWeight = Math.min(...weightEntries.map((e) => e.weight))
                        const maxWeight = Math.max(...weightEntries.map((e) => e.weight))
                        const range = maxWeight - minWeight
                        const percentage = range > 0 ? ((entry.weight - minWeight) / range) * 100 : 50

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
                    {weightEntries
                      .slice(0, 7)
                      .reverse()
                      .map((entry, i) => (
                        <div key={i}>{entry.weight}</div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="achievements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>Badges and milestones you've reached</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                          achievement.unlocked ? `bg-[${achievement.color}]/10` : "opacity-50"
                        }`}
                      >
                        <div
                          className={`h-12 w-12 rounded-full bg-[${achievement.color}]/20 flex items-center justify-center mb-2`}
                        >
                          <Award className={`h-6 w-6 text-[${achievement.color}]`} />
                        </div>
                        <div className="font-medium text-center">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground text-center">{achievement.description}</div>
                        {achievement.unlocked && achievement.date && (
                          <div className="text-xs mt-1 text-[#27AE60]">Unlocked: {achievement.date}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>Your recent activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityHistory.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={`flex items-center ${index < activityHistory.length - 1 ? "border-b pb-4" : ""}`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full bg-${
                            activity.type === "weight"
                              ? "[#27AE60]"
                              : activity.type === "workout"
                                ? "[#2980B9]"
                                : activity.type === "steps"
                                  ? "[#E74C3C]"
                                  : "[#F39C12]"
                          }/20 flex items-center justify-center mr-3`}
                        >
                          <User
                            className={`h-5 w-5 text-${
                              activity.type === "weight"
                                ? "[#27AE60]"
                                : activity.type === "workout"
                                  ? "[#2980B9]"
                                  : activity.type === "steps"
                                    ? "[#E74C3C]"
                                    : "[#F39C12]"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">{activity.description}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{activity.date}</div>
                      </div>
                    ))}

                    {activityHistory.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No activity history yet. Start tracking your fitness!
                      </div>
                    )}
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
