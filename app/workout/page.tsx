"use client"

import React from "react"

import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFitness } from "@/context/fitness-context"
import { formatDate, generateId } from "@/lib/utils"
import type { Exercise, ExerciseSet, WorkoutEntry, WorkoutExercise } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"

export default function WorkoutPage() {
  const { workouts, predefinedExercises, addWorkout } = useFitness()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("log")

  // New workout state
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false)
  const [workoutName, setWorkoutName] = useState("")
  const [workoutNotes, setWorkoutNotes] = useState("")
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([])

  // Exercise selection state
  const [isSelectingExercise, setIsSelectingExercise] = useState(false)
  const [exerciseFilter, setExerciseFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Exercise set editing
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)

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

  const startLoggingWorkout = () => {
    setIsLoggingWorkout(true)
    setWorkoutName("")
    setWorkoutNotes("")
    setSelectedExercises([])
  }

  const cancelLoggingWorkout = () => {
    if (selectedExercises.length > 0) {
      if (!confirm("Are you sure you want to cancel? Your workout data will be lost.")) {
        return
      }
    }
    setIsLoggingWorkout(false)
    setEditingExerciseId(null)
  }

  const openExerciseSelection = () => {
    setIsSelectingExercise(true)
    setExerciseFilter("")
    setCategoryFilter("all")
  }

  const closeExerciseSelection = () => {
    setIsSelectingExercise(false)
  }

  const addExerciseToWorkout = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: generateId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      sets: [],
      caloriesBurned: 0,
    }

    setSelectedExercises((prev) => [...prev, newExercise])
    setIsSelectingExercise(false)
    setEditingExerciseId(newExercise.id)
  }

  const removeExerciseFromWorkout = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.id !== exerciseId))
    if (editingExerciseId === exerciseId) {
      setEditingExerciseId(null)
    }
  }

  const addSetToExercise = (exerciseId: string) => {
    const exercise = selectedExercises.find((ex) => ex.id === exerciseId)
    if (!exercise) return

    const predefinedExercise = predefinedExercises.find((ex) => ex.id === exercise.exerciseId)
    if (!predefinedExercise) return

    const newSet: ExerciseSet = {
      id: generateId(),
      reps: predefinedExercise.category === "strength" ? 10 : undefined,
      weight: predefinedExercise.category === "strength" ? 20 : undefined,
      duration: predefinedExercise.category !== "strength" ? 10 : undefined,
      distance: predefinedExercise.category === "cardio" ? 1 : undefined,
    }

    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex)),
    )
  }

  const updateSet = (exerciseId: string, setId: string, field: keyof ExerciseSet, value: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
            }
          : ex,
      ),
    )
  }

  const removeSet = (exerciseId: string, setId: string) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((set) => set.id !== setId) } : ex)),
    )
  }

  const calculateExerciseCalories = (exercise: WorkoutExercise): number => {
    const predefinedExercise = predefinedExercises.find((ex) => ex.id === exercise.exerciseId)
    if (!predefinedExercise) return 0

    let totalDuration = 0

    if (exercise.category === "strength") {
      // Estimate 1 minute per set for strength exercises
      totalDuration = exercise.sets.length
    } else {
      // Sum up duration for cardio/flexibility exercises
      totalDuration = exercise.sets.reduce((sum, set) => sum + (set.duration || 0), 0)
    }

    return Math.round(predefinedExercise.caloriesPerMinute * totalDuration)
  }

  const updateExerciseCalories = () => {
    setSelectedExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        caloriesBurned: calculateExerciseCalories(ex),
      })),
    )
  }

  const calculateTotalCalories = (): number => {
    return selectedExercises.reduce((sum, ex) => sum + calculateExerciseCalories(ex), 0)
  }

  const calculateTotalDuration = (): number => {
    let totalDuration = 0

    selectedExercises.forEach((exercise) => {
      if (exercise.category === "strength") {
        // Estimate 1 minute per set for strength exercises
        totalDuration += exercise.sets.length
      } else {
        // Sum up duration for cardio/flexibility exercises
        totalDuration += exercise.sets.reduce((sum, set) => sum + (set.duration || 0), 0)
      }
    })

    // Add some rest time between exercises
    totalDuration += selectedExercises.length > 0 ? (selectedExercises.length - 1) * 2 : 0

    return totalDuration
  }

  const saveWorkout = () => {
    if (!workoutName.trim()) {
      alert("Please enter a workout name")
      return
    }

    if (selectedExercises.length === 0) {
      alert("Please add at least one exercise")
      return
    }

    // Update calories for each exercise
    const updatedExercises = selectedExercises.map((ex) => ({
      ...ex,
      caloriesBurned: calculateExerciseCalories(ex),
    }))

    const totalDuration = calculateTotalDuration()
    const totalCalories = updatedExercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0)

    const newWorkout: Omit<WorkoutEntry, "id" | "timestamp"> = {
      name: workoutName,
      exercises: updatedExercises,
      duration: totalDuration,
      caloriesBurned: totalCalories,
      date: formatDate(selectedDate),
      notes: workoutNotes,
    }

    addWorkout(newWorkout)
    setIsLoggingWorkout(false)
    setActiveTab("history")
  }

  // Filter exercises based on search and category
  const filteredExercises = predefinedExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(exerciseFilter.toLowerCase())
    const matchesCategory = categoryFilter === "all" || exercise.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Group exercises by category for display
  const groupedExercises: Record<string, Exercise[]> = {}

  filteredExercises.forEach((exercise) => {
    if (!groupedExercises[exercise.category]) {
      groupedExercises[exercise.category] = []
    }
    groupedExercises[exercise.category].push(exercise)
  })

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">Workout Logger</h1>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
          {!isLoggingWorkout && !isSelectingExercise ? (
            <>
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
                <Button variant="default" className="bg-[#27AE60] hover:bg-[#219653]" onClick={startLoggingWorkout}>
                  <Plus className="mr-2 h-4 w-4" />
                  Log Workout
                </Button>
              </div>

              <Tabs defaultValue="log" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="log">Log</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="log" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Start</CardTitle>
                      <CardDescription>Choose a workout type to get started</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <Button
                          variant="outline"
                          className="h-auto py-6 flex flex-col"
                          onClick={() => {
                            startLoggingWorkout()
                            setWorkoutName("Strength Training")
                          }}
                        >
                          <Dumbbell className="h-8 w-8 mb-2 text-[#E74C3C]" />
                          <span className="text-base font-medium">Strength</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-6 flex flex-col"
                          onClick={() => {
                            startLoggingWorkout()
                            setWorkoutName("Cardio Session")
                          }}
                        >
                          <Flame className="h-8 w-8 mb-2 text-[#F39C12]" />
                          <span className="text-base font-medium">Cardio</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-6 flex flex-col"
                          onClick={() => {
                            startLoggingWorkout()
                            setWorkoutName("Flexibility & Mobility")
                          }}
                        >
                          <Calendar className="h-8 w-8 mb-2 text-[#2980B9]" />
                          <span className="text-base font-medium">Flexibility</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Workouts</CardTitle>
                      <CardDescription>Your last 3 workouts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sortedWorkouts.slice(0, 3).map((workout) => (
                        <div key={workout.id} className="mb-4 last:mb-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-medium">{workout.name}</h3>
                            <span className="text-sm text-muted-foreground">{workout.date}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="mr-3">{workout.duration} min</span>
                            <Flame className="h-4 w-4 mr-1" />
                            <span>{workout.caloriesBurned} kcal</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {workout.exercises.map((exercise) => (
                              <Badge key={exercise.id} variant="outline" className="bg-muted/50">
                                {exercise.exerciseName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                      {sortedWorkouts.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          No workouts logged yet. Start tracking your fitness!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="history" className="space-y-4">
                  {sortedWorkouts.length > 0 ? (
                    sortedWorkouts.map((workout) => (
                      <Card key={workout.id} className="mb-4">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle>{workout.name}</CardTitle>
                            <span className="text-sm text-muted-foreground">{workout.date}</span>
                          </div>
                          <CardDescription className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="mr-3">{workout.duration} min</span>
                            <Flame className="h-4 w-4 mr-1" />
                            <span>{workout.caloriesBurned} kcal</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {workout.notes && (
                            <div className="mb-3 text-sm italic text-muted-foreground">{workout.notes}</div>
                          )}
                          <div className="space-y-3">
                            {workout.exercises.map((exercise) => (
                              <div key={exercise.id} className="border rounded-md p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-medium">{exercise.exerciseName}</h4>
                                  <Badge variant="outline" className="capitalize">
                                    {exercise.category}
                                  </Badge>
                                </div>
                                {exercise.category === "strength" ? (
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="font-medium">Set</div>
                                    <div className="font-medium">Weight</div>
                                    <div className="font-medium">Reps</div>
                                    {exercise.sets.map((set, index) => (
                                      <React.Fragment key={set.id}>
                                        <div>{index + 1}</div>
                                        <div>{set.weight} kg</div>
                                        <div>{set.reps}</div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="font-medium">Set</div>
                                    <div className="font-medium">Duration</div>
                                    <div className="font-medium">Distance</div>
                                    {exercise.sets.map((set, index) => (
                                      <React.Fragment key={set.id}>
                                        <div>{index + 1}</div>
                                        <div>{set.duration} min</div>
                                        <div>{set.distance ? `${set.distance} km` : "-"}</div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No workouts logged yet. Start tracking your fitness!
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : isSelectingExercise ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select Exercise</h2>
                <Button variant="ghost" size="icon" onClick={closeExerciseSelection}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <Label htmlFor="exercise-search">Search</Label>
                  <Input
                    id="exercise-search"
                    placeholder="Search exercises..."
                    value={exerciseFilter}
                    onChange={(e) => setExerciseFilter(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <Label htmlFor="category-filter">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category-filter">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedExercises).map(([category, exercises]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium capitalize mb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {exercises.map((exercise) => (
                        <Button
                          key={exercise.id}
                          variant="outline"
                          className="justify-start h-auto py-3"
                          onClick={() => addExerciseToWorkout(exercise)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{exercise.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ~{exercise.caloriesPerMinute} kcal/min
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(groupedExercises).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No exercises found. Try a different search term or category.
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={closeExerciseSelection}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Log Workout</h2>
                <Button variant="ghost" size="icon" onClick={cancelLoggingWorkout}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="workout-name">Workout Name</Label>
                  <Input
                    id="workout-name"
                    placeholder="e.g., Upper Body Strength"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="workout-notes">Notes (optional)</Label>
                  <Textarea
                    id="workout-notes"
                    placeholder="Add any notes about this workout..."
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Exercises</h3>
                  <Button variant="outline" size="sm" onClick={openExerciseSelection}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exercise
                  </Button>
                </div>

                {selectedExercises.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Dumbbell className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No exercises added yet</p>
                      <Button variant="outline" className="mt-4" onClick={openExerciseSelection}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Exercise
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {selectedExercises.map((exercise) => (
                      <Card key={exercise.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{exercise.exerciseName}</CardTitle>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setEditingExerciseId(exercise.id === editingExerciseId ? null : exercise.id)
                                }
                              >
                                {exercise.id === editingExerciseId ? "Done" : "Edit"}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeExerciseFromWorkout(exercise.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardDescription>
                            <Badge variant="outline" className="capitalize">
                              {exercise.category}
                            </Badge>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {exercise.id === editingExerciseId ? (
                            <div className="space-y-4">
                              {exercise.sets.length > 0 ? (
                                <div>
                                  {exercise.category === "strength" ? (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-2 font-medium text-sm">Set</div>
                                        <div className="col-span-4 font-medium text-sm">Weight (kg)</div>
                                        <div className="col-span-4 font-medium text-sm">Reps</div>
                                        <div className="col-span-2"></div>
                                      </div>
                                      {exercise.sets.map((set, index) => (
                                        <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                                          <div className="col-span-2 text-sm">{index + 1}</div>
                                          <div className="col-span-4">
                                            <Input
                                              type="number"
                                              value={set.weight || 0}
                                              min={0}
                                              step={2.5}
                                              onChange={(e) =>
                                                updateSet(
                                                  exercise.id,
                                                  set.id,
                                                  "weight",
                                                  Number.parseFloat(e.target.value),
                                                )
                                              }
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="col-span-4">
                                            <Input
                                              type="number"
                                              value={set.reps || 0}
                                              min={0}
                                              onChange={(e) =>
                                                updateSet(exercise.id, set.id, "reps", Number.parseInt(e.target.value))
                                              }
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeSet(exercise.id, set.id)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-2 font-medium text-sm">Set</div>
                                        <div className="col-span-4 font-medium text-sm">Duration (min)</div>
                                        <div className="col-span-4 font-medium text-sm">Distance (km)</div>
                                        <div className="col-span-2"></div>
                                      </div>
                                      {exercise.sets.map((set, index) => (
                                        <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                                          <div className="col-span-2 text-sm">{index + 1}</div>
                                          <div className="col-span-4">
                                            <Input
                                              type="number"
                                              value={set.duration || 0}
                                              min={0}
                                              onChange={(e) =>
                                                updateSet(
                                                  exercise.id,
                                                  set.id,
                                                  "duration",
                                                  Number.parseFloat(e.target.value),
                                                )
                                              }
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="col-span-4">
                                            <Input
                                              type="number"
                                              value={set.distance || 0}
                                              min={0}
                                              step={0.1}
                                              onChange={(e) =>
                                                updateSet(
                                                  exercise.id,
                                                  set.id,
                                                  "distance",
                                                  Number.parseFloat(e.target.value),
                                                )
                                              }
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeSet(exercise.id, set.id)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-2 text-sm text-muted-foreground">No sets added yet</div>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => addSetToExercise(exercise.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Set
                              </Button>
                            </div>
                          ) : (
                            <div>
                              {exercise.sets.length > 0 ? (
                                <div>
                                  {exercise.category === "strength" ? (
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      <div className="font-medium">Set</div>
                                      <div className="font-medium">Weight</div>
                                      <div className="font-medium">Reps</div>
                                      {exercise.sets.map((set, index) => (
                                        <React.Fragment key={set.id}>
                                          <div>{index + 1}</div>
                                          <div>{set.weight} kg</div>
                                          <div>{set.reps}</div>
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      <div className="font-medium">Set</div>
                                      <div className="font-medium">Duration</div>
                                      <div className="font-medium">Distance</div>
                                      {exercise.sets.map((set, index) => (
                                        <React.Fragment key={set.id}>
                                          <div>{index + 1}</div>
                                          <div>{set.duration} min</div>
                                          <div>{set.distance ? `${set.distance} km` : "-"}</div>
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-2 text-sm text-muted-foreground">
                                  Tap 'Edit' to add sets
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Estimated</div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{calculateTotalDuration()} min</span>
                          </div>
                          <div className="flex items-center">
                            <Flame className="h-4 w-4 mr-1" />
                            <span>{calculateTotalCalories()} kcal</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="default" className="bg-[#27AE60] hover:bg-[#219653]" onClick={saveWorkout}>
                        <Save className="h-4 w-4 mr-1" />
                        Save Workout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
