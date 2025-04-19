"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Scale, TrendingDown, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFitness } from "@/context/fitness-context"
import { formatDate } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"

export default function WeightPage() {
  const { weightEntries, currentWeight, addWeightEntry, profile, goals } = useFitness()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [newWeight, setNewWeight] = useState("")

  // Sort weight entries by date (newest first)
  const sortedEntries = [...weightEntries].sort((a, b) => b.timestamp - a.timestamp)

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

  const handleAddWeight = () => {
    if (newWeight && !isNaN(Number.parseFloat(newWeight))) {
      addWeightEntry(Number.parseFloat(newWeight))
      setNewWeight("")
    }
  }

  // Calculate weight change
  const calculateWeightChange = () => {
    if (weightEntries.length < 2) return { value: 0, isGain: false }

    const latestEntry = sortedEntries[0]
    const previousEntry = sortedEntries[1]

    const change = latestEntry.weight - previousEntry.weight
    return {
      value: Math.abs(change),
      isGain: change > 0,
    }
  }

  const weightChange = calculateWeightChange()

  // Calculate progress towards goal
  const calculateGoalProgress = () => {
    if (!currentWeight || !goals.weight) return 0

    const startWeight = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].weight : currentWeight
    const targetWeight = goals.weight

    // If goal is to lose weight
    if (targetWeight < startWeight) {
      const totalToLose = startWeight - targetWeight
      const lost = startWeight - currentWeight
      return Math.min(100, (lost / totalToLose) * 100)
    }
    // If goal is to gain weight
    else if (targetWeight > startWeight) {
      const totalToGain = targetWeight - startWeight
      const gained = currentWeight - startWeight
      return Math.min(100, (gained / totalToGain) * 100)
    }

    // If already at goal
    return 100
  }

  const goalProgress = calculateGoalProgress()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">Weight Tracker</h1>
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
              <span className="font-medium">{formatDate(selectedDate)}</span>
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
              <CardTitle>Current Weight</CardTitle>
              <CardDescription>Your weight tracking information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-[#27AE60]/20">
                  <Scale className="absolute h-12 w-12 text-[#27AE60]/30" />
                  <div className="text-center z-10">
                    <div className="text-4xl font-bold text-[#27AE60]">{currentWeight}</div>
                    <div className="text-sm text-muted-foreground">kg</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold flex items-center justify-center">
                      {weightChange.value.toFixed(1)}
                      {weightChange.value > 0 &&
                        (weightChange.isGain ? (
                          <TrendingUp className="ml-1 h-5 w-5 text-red-500" />
                        ) : (
                          <TrendingDown className="ml-1 h-5 w-5 text-green-500" />
                        ))}
                    </div>
                    <div className="text-xs text-muted-foreground">kg change</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{goals.weight}</div>
                    <div className="text-xs text-muted-foreground">goal weight</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{goalProgress.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">to goal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Log Today's Weight</CardTitle>
              <CardDescription>Keep track of your daily weight</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="weight" className="sr-only">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter weight in kg"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    step="0.1"
                  />
                </div>
                <Button onClick={handleAddWeight} disabled={!newWeight || isNaN(Number.parseFloat(newWeight))}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
              <CardDescription>Your weight tracking over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-end justify-between gap-2 mb-4">
                {sortedEntries
                  .slice(0, 7)
                  .reverse()
                  .map((entry, i) => {
                    const minWeight = Math.min(...sortedEntries.map((e) => e.weight))
                    const maxWeight = Math.max(...sortedEntries.map((e) => e.weight))
                    const range = maxWeight - minWeight || 5 // Default range if all weights are the same
                    const percentage = ((entry.weight - minWeight) / range) * 70 + 10 // Scale to 10-80% height

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

              <div className="space-y-4">
                {sortedEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between ${index < sortedEntries.length - 1 ? "border-b pb-2" : ""}`}
                  >
                    <div className="flex items-center">
                      <Scale className="mr-2 h-5 w-5 text-[#27AE60]" />
                      <div>
                        <div className="font-medium">{entry.weight} kg</div>
                        <div className="text-xs text-muted-foreground">{entry.date}</div>
                      </div>
                    </div>
                    {index > 0 && (
                      <div className="text-sm">
                        {(entry.weight - sortedEntries[index - 1].weight).toFixed(1)} kg
                        {entry.weight > sortedEntries[index - 1].weight ? (
                          <TrendingUp className="inline ml-1 h-4 w-4 text-red-500" />
                        ) : entry.weight < sortedEntries[index - 1].weight ? (
                          <TrendingDown className="inline ml-1 h-4 w-4 text-green-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
                {sortedEntries.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No weight entries yet. Start tracking your weight!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
