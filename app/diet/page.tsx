"use client"

import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFitness } from "@/context/fitness-context"
import { formatDate, getDateString } from "@/lib/utils"
import type { Food, Meal } from "@/lib/types"
import NutritionixFoodSearch from "./nutritionix-food-search"
import { BottomNav } from "@/components/bottom-nav"

export default function DietPage() {
  const { getMealsForDate, getCaloriesForDate, goals, addMeal, editMeal, deleteMeal, getRecommendedCalories } =
    useFitness()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const selectedDateString = getDateString(selectedDate)

  const [activeTab, setActiveTab] = useState("meals")
  const [showNutritionixSearch, setShowNutritionixSearch] = useState(false)
  const [mealCategory, setMealCategory] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast")

  // Get meals and calories for the selected date
  const meals = getMealsForDate(selectedDateString)
  const caloriesForDate = getCaloriesForDate(selectedDateString)

  const caloriePercentage = Math.min(Math.round((caloriesForDate / goals.calories) * 100), 100)
  const caloriesRemaining = goals.calories - caloriesForDate
  const recommendedCalories = getRecommendedCalories()

  // Group meals by category
  const breakfastMeals = meals.filter((meal) => meal.category === "breakfast")
  const lunchMeals = meals.filter((meal) => meal.category === "lunch")
  const dinnerMeals = meals.filter((meal) => meal.category === "dinner")
  const snackMeals = meals.filter((meal) => meal.category === "snack")

  // Calculate daily nutrition using useMemo to prevent unnecessary recalculations
  const dailyNutrition = useMemo(() => {
    return meals.reduce(
      (totals, meal) => {
        if (meal.nutrition) {
          return {
            carbs: totals.carbs + (meal.nutrition.carbs || 0),
            protein: totals.protein + (meal.nutrition.protein || 0),
            fat: totals.fat + (meal.nutrition.fat || 0),
            fiber: totals.fiber + (meal.nutrition.fiber || 0),
            sugar: totals.sugar + (meal.nutrition.sugar || 0),
            sodium: totals.sodium + (meal.nutrition.sodium || 0),
          }
        }
        return totals
      },
      { carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
    )
  }, [meals])

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

  const openFoodSearch = (category: "breakfast" | "lunch" | "dinner" | "snack") => {
    setMealCategory(category)
    setShowNutritionixSearch(true)
  }

  // Updated to ensure the displayed nutrition values match what's saved
  const handleFoodSelect = (food: Food, servingSize: string, quantity: number, nutrition: any) => {
    const serving = food.servingSizes.find((s) => s.name === servingSize)
    if (!serving) return

    const now = new Date()
    const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true })

    // Log the values for debugging
    console.log("Adding meal with nutrition:", {
      name: food.name,
      calories: nutrition.calories,
      carbs: nutrition.carbs,
      protein: nutrition.protein,
      fat: nutrition.fat,
      portion: `${quantity} ${servingSize} (${Math.round(serving.grams * quantity)}g)`,
    })

    // Create a new meal with the calculated nutrition values
    const newMeal: Omit<Meal, "id"> = {
      name: `${food.name}${quantity !== 1 ? ` (${quantity})` : ""}`,
      calories: nutrition.calories, // Use the calculated calories
      portion: `${quantity} ${servingSize} (${Math.round(serving.grams * quantity)}g)`,
      time,
      category: mealCategory,
      nutrition: {
        carbs: nutrition.carbs,
        protein: nutrition.protein,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        sugar: nutrition.sugar,
        sodium: nutrition.sodium,
      },
      timestamp: Date.now(),
    }

    // Add meal for the selected date
    addMeal(newMeal, selectedDateString)
    setShowNutritionixSearch(false)
  }

  const handleEditMeal = (id: string) => {
    const meal = meals.find((m) => m.id === id)
    if (!meal) return

    const name = prompt("Enter meal name:", meal.name)
    if (!name) return

    const calories = prompt("Enter calories:", meal.calories.toString())
    if (!calories || isNaN(Number.parseInt(calories))) return

    const portion = prompt("Enter portion:", meal.portion)
    if (!portion) return

    const time = prompt("Enter time:", meal.time)
    if (!time) return

    editMeal(id, {
      name,
      calories: Number.parseInt(calories),
      portion,
      time,
    })
  }

  const handleDeleteMeal = (id: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
      deleteMeal(id)
    }
  }

  // Calculate macronutrient percentages (simplified)
  const carbPercentage = 50
  const proteinPercentage = 25
  const fatPercentage = 25

  // Calculate macronutrient grams
  const carbGrams = Math.round((goals.calories * carbPercentage) / 100 / 4) // 4 calories per gram
  const proteinGrams = Math.round((goals.calories * proteinPercentage) / 100 / 4) // 4 calories per gram
  const fatGrams = Math.round((goals.calories * fatPercentage) / 100 / 9) // 9 calories per gram

  const isToday = selectedDateString === getDateString()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">Diet & Calories</h1>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setShowNutritionixSearch(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
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
              <CardTitle>Calorie Summary</CardTitle>
              <CardDescription>Your calorie intake for {isToday ? "today" : formatDate(selectedDate)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-[#27AE60]/20">
                  <svg className="absolute h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="stroke-[#27AE60] stroke-[8px] fill-none"
                      cx="50"
                      cy="50"
                      r="46"
                      strokeDasharray="289.02652413026095"
                      strokeDashoffset={`${289.02652413026095 - (289.02652413026095 * caloriePercentage) / 100}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#27AE60]">{caloriesForDate}</div>
                    <div className="text-sm text-muted-foreground">of {goals.calories} goal</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{caloriesRemaining}</div>
                    <div className="text-xs text-muted-foreground">remaining</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{carbGrams}g</div>
                    <div className="text-xs text-muted-foreground">carbs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{proteinGrams}g</div>
                    <div className="text-xs text-muted-foreground">protein</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{fatGrams}g</div>
                    <div className="text-xs text-muted-foreground">fat</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Recommended daily intake: {recommendedCalories} calories
                </div>
              </div>
            </CardContent>
          </Card>
          <Tabs defaultValue="meals" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meals">Meals</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            </TabsList>
            <TabsContent value="meals" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Breakfast</h3>
                  {isToday && (
                    <Button variant="ghost" size="sm" onClick={() => openFoodSearch("breakfast")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                {breakfastMeals.length > 0 ? (
                  breakfastMeals.map((meal) => (
                    <Card key={meal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{meal.name}</div>
                            <div className="text-sm text-muted-foreground">{meal.portion}</div>
                            {meal.nutrition && (
                              <div className="text-xs text-muted-foreground mt-1">
                                P: {meal.nutrition.protein.toFixed(1)}g • C: {meal.nutrition.carbs.toFixed(1)}g • F:{" "}
                                {meal.nutrition.fat.toFixed(1)}g
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{meal.calories} kcal</div>
                            {isToday && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditMeal(meal.id)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMeal(meal.id)}>
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted-foreground">No breakfast logged</div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Lunch</h3>
                  {isToday && (
                    <Button variant="ghost" size="sm" onClick={() => openFoodSearch("lunch")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                {lunchMeals.length > 0 ? (
                  lunchMeals.map((meal) => (
                    <Card key={meal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{meal.name}</div>
                            <div className="text-sm text-muted-foreground">{meal.portion}</div>
                            {meal.nutrition && (
                              <div className="text-xs text-muted-foreground mt-1">
                                P: {meal.nutrition.protein.toFixed(1)}g • C: {meal.nutrition.carbs.toFixed(1)}g • F:{" "}
                                {meal.nutrition.fat.toFixed(1)}g
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{meal.calories} kcal</div>
                            {isToday && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditMeal(meal.id)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMeal(meal.id)}>
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted-foreground">No lunch logged</div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Snacks</h3>
                  {isToday && (
                    <Button variant="ghost" size="sm" onClick={() => openFoodSearch("snack")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                {snackMeals.length > 0 ? (
                  snackMeals.map((meal) => (
                    <Card key={meal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{meal.name}</div>
                            <div className="text-sm text-muted-foreground">{meal.portion}</div>
                            {meal.nutrition && (
                              <div className="text-xs text-muted-foreground mt-1">
                                P: {meal.nutrition.protein.toFixed(1)}g • C: {meal.nutrition.carbs.toFixed(1)}g • F:{" "}
                                {meal.nutrition.fat.toFixed(1)}g
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{meal.calories} kcal</div>
                            {isToday && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditMeal(meal.id)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMeal(meal.id)}>
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted-foreground">No snacks logged</div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Dinner</h3>
                  {isToday && (
                    <Button variant="ghost" size="sm" onClick={() => openFoodSearch("dinner")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                {dinnerMeals.length > 0 ? (
                  dinnerMeals.map((meal) => (
                    <Card key={meal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{meal.name}</div>
                            <div className="text-sm text-muted-foreground">{meal.portion}</div>
                            {meal.nutrition && (
                              <div className="text-xs text-muted-foreground mt-1">
                                P: {meal.nutrition.protein.toFixed(1)}g • C: {meal.nutrition.carbs.toFixed(1)}g • F:{" "}
                                {meal.nutrition.fat.toFixed(1)}g
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{meal.calories} kcal</div>
                            {isToday && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditMeal(meal.id)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMeal(meal.id)}>
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted-foreground">No dinner logged</div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="nutrition" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Macronutrients</CardTitle>
                  <CardDescription>Your macronutrient breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-[#27AE60]" />
                          <span>Carbs ({carbPercentage}%)</span>
                        </div>
                        <div>
                          {dailyNutrition.carbs.toFixed(1)}g / {carbGrams}g
                        </div>
                      </div>
                      <Progress value={(dailyNutrition.carbs / carbGrams) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-[#2980B9]" />
                          <span>Protein ({proteinPercentage}%)</span>
                        </div>
                        <div>
                          {dailyNutrition.protein.toFixed(1)}g / {proteinGrams}g
                        </div>
                      </div>
                      <Progress
                        value={(dailyNutrition.protein / proteinGrams) * 100}
                        className="h-2 bg-muted [&>div]:bg-[#2980B9]"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-[#E74C3C]" />
                          <span>Fat ({fatPercentage}%)</span>
                        </div>
                        <div>
                          {dailyNutrition.fat.toFixed(1)}g / {fatGrams}g
                        </div>
                      </div>
                      <Progress
                        value={(dailyNutrition.fat / fatGrams) * 100}
                        className="h-2 bg-muted [&>div]:bg-[#E74C3C]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Micronutrients</CardTitle>
                  <CardDescription>Your vitamin and mineral intake</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>Fiber</div>
                          <div>{dailyNutrition.fiber.toFixed(1)}g / 25g</div>
                        </div>
                        <Progress value={(dailyNutrition.fiber / 25) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>Sugar</div>
                          <div>{dailyNutrition.sugar.toFixed(1)}g / 25g</div>
                        </div>
                        <Progress value={(dailyNutrition.sugar / 25) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>Sodium</div>
                          <div>{dailyNutrition.sodium.toFixed(0)}mg / 2300mg</div>
                        </div>
                        <Progress value={(dailyNutrition.sodium / 2300) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {isToday && (
        <div className="fixed bottom-6 right-6">
          <Button
            size="lg"
            className="rounded-full h-14 w-14 bg-[#27AE60] hover:bg-[#219653]"
            onClick={() => setShowNutritionixSearch(true)}
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Add food</span>
          </Button>
        </div>
      )}
      <BottomNav />

      {showNutritionixSearch && (
        <NutritionixFoodSearch
          onSelectFood={handleFoodSelect}
          onClose={() => setShowNutritionixSearch(false)}
          mealCategory={mealCategory}
        />
      )}
    </div>
  )
}
