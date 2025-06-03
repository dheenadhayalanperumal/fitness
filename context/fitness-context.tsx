"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type {
  Meal,
  WaterEntry,
  WorkoutEntry,
  WeightEntry,
  StepEntry,
  UserGoals,
  AppSettings,
  Achievement,
  ActivityHistoryItem,
  Exercise,
} from "@/lib/types"
import { generateId, getDateString, calculateBMI } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

// Import notification services
import {
  sendWaterReminderNotification,
  sendSedentaryReminderNotification,
  sendCalorieIntakeNotification,
  requestNotificationPermission,
} from "@/lib/notification-service"

// Add this type for food items
export type Food = {
  id: string
  name: string
  calories: number // per 100g
  protein: number // per 100g
  carbs: number // per 100g
  fat: number // per 100g
  servingSizes: {
    name: string // e.g., "cup", "piece", "slice"
    grams: number // weight in grams
  }[]
  fiber?: number
  sugar?: number
  sodium?: number
}

// Update the UserProfile type to include mobileNumber
export type UserProfileType = {
  name: string
  email: string
  mobileNumber?: string
  height: number
  weight: number
  birthdate: string
  dietPurpose?: "lose" | "maintain" | "gain"
}

// Add these to the FitnessContextType interface
interface FitnessContextType {
  // User data
  profile: UserProfileType
  updateProfile: (profile: Partial<UserProfileType>) => void
  goals: UserGoals
  updateGoals: (goals: Partial<UserGoals>) => void
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void

  // Water tracking
  waterEntries: WaterEntry[]
  todayWaterTotal: number
  getWaterEntriesForDate: (date: string) => WaterEntry[]
  getWaterTotalForDate: (date: string) => number
  addWater: (amount: number, date?: string) => void
  editWaterEntry: (id: string, amount: number) => void
  deleteWaterEntry: (id: string) => void

  // Meals tracking
  meals: Meal[]
  todayCalories: number
  getMealsForDate: (date: string) => Meal[]
  getCaloriesForDate: (date: string) => number
  addMeal: (meal: Omit<Meal, "id">, date?: string) => void
  editMeal: (id: string, meal: Partial<Meal>) => void
  deleteMeal: (id: string) => void

  // Weight tracking
  weightEntries: WeightEntry[]
  currentWeight: number
  getWeightForDate: (date: string) => number | null
  addWeightEntry: (weight: number, date?: string) => void

  // Workouts
  workouts: WorkoutEntry[]
  predefinedExercises: Exercise[]
  getWorkoutsForDate: (date: string) => WorkoutEntry[]
  addWorkout: (workout: Omit<WorkoutEntry, "id" | "timestamp">, date?: string) => void
  addExercise: (exercise: Omit<Exercise, "id">) => void
  getExerciseById: (id: string) => Exercise | undefined

  // Achievements and history
  achievements: Achievement[]
  activityHistory: ActivityHistoryItem[]

  // Utility
  calculateBMI: () => number
  getWeeklyProgress: () => {
    water: { current: number; goal: number }
    workouts: { current: number; goal: number }
    sleep: { current: number; goal: number }
  }

  // Notification settings
  notificationsEnabled: boolean
  enableNotifications: () => Promise<boolean>

  // Food database
  searchFoods: (query: string) => Food[]
  getFoodByName: (name: string) => Food | undefined

  // Calorie recommendations
  getRecommendedCalories: () => number

  dataLoaded: boolean
  syncWithDatabase: () => Promise<void>
}

// Update the defaultProfile to include mobileNumber
const defaultProfile: UserProfileType = {
  name: "John Doe",
  email: "john.doe@example.com",
  mobileNumber: "",
  height: 175,
  weight: 68.5,
  birthdate: "1990-01-01",
  dietPurpose: "maintain",
}

const defaultGoals: UserGoals = {
  calories: 2000,
  water: 2.5, // in liters
  sleep: 8, // in hours
  weight: 65, // target weight in kg
}

const defaultSettings: AppSettings = {
  darkMode: false,
  notifications: true,
  healthSync: true,
}

const defaultAchievements: Achievement[] = [
  {
    id: "2",
    name: "Water Master",
    description: "Reached water goal 7 days in a row",
    icon: "award",
    color: "#2980B9",
    unlocked: false,
  },
  {
    id: "3",
    name: "Workout Warrior",
    description: "Completed 10 workouts",
    icon: "award",
    color: "#E74C3C",
    unlocked: false,
  },
  {
    id: "4",
    name: "Early Bird",
    description: "Tracked activity before 7 AM",
    icon: "award",
    color: "#F39C12",
    unlocked: false,
  },
  {
    id: "5",
    name: "Weight Goal",
    description: "Reached weight goal",
    icon: "award",
    color: "#9B59B6",
    unlocked: false,
  },
]

const defaultPredefinedExercises: Exercise[] = [
  // Strength exercises
  { id: "ex1", name: "Bench Press", category: "strength", caloriesPerMinute: 8 },
  { id: "ex2", name: "Squats", category: "strength", caloriesPerMinute: 8.5 },
  { id: "ex3", name: "Deadlift", category: "strength", caloriesPerMinute: 9 },
  { id: "ex4", name: "Pull-ups", category: "strength", caloriesPerMinute: 8 },
  { id: "ex5", name: "Push-ups", category: "strength", caloriesPerMinute: 7 },
  { id: "ex6", name: "Lunges", category: "strength", caloriesPerMinute: 6 },
  { id: "ex7", name: "Shoulder Press", category: "strength", caloriesPerMinute: 7 },
  { id: "ex8", name: "Bicep Curls", category: "strength", caloriesPerMinute: 5 },

  // Cardio exercises
  { id: "ex9", name: "Running", category: "cardio", caloriesPerMinute: 10 },
  { id: "ex10", name: "Cycling", category: "cardio", caloriesPerMinute: 8 },
  { id: "ex11", name: "Swimming", category: "cardio", caloriesPerMinute: 9 },
  { id: "ex12", name: "Jump Rope", category: "cardio", caloriesPerMinute: 12 },
  { id: "ex13", name: "Rowing", category: "cardio", caloriesPerMinute: 8.5 },
  { id: "ex14", name: "Elliptical", category: "cardio", caloriesPerMinute: 7.5 },
  { id: "ex15", name: "Stair Climber", category: "cardio", caloriesPerMinute: 9 },

  // Flexibility exercises
  { id: "ex16", name: "Yoga", category: "flexibility", caloriesPerMinute: 4 },
  { id: "ex17", name: "Pilates", category: "flexibility", caloriesPerMinute: 5 },
  { id: "ex18", name: "Stretching", category: "flexibility", caloriesPerMinute: 2.5 },

  // Sports
  { id: "ex19", name: "Basketball", category: "sports", caloriesPerMinute: 8 },
  { id: "ex20", name: "Soccer", category: "sports", caloriesPerMinute: 8.5 },
  { id: "ex21", name: "Tennis", category: "sports", caloriesPerMinute: 7 },
  { id: "ex22", name: "Volleyball", category: "sports", caloriesPerMinute: 6 },
]

// Create the context
const FitnessContext = createContext<FitnessContextType | undefined>(undefined)

// Add this to the provider component
export function FitnessProvider({ children }: { children: React.ReactNode }) {
  // Get auth context
  const { user, token } = useAuth()

  // Initialize state with defaults
  const [profile, setProfile] = useState<UserProfileType>(defaultProfile)
  const [goals, setGoals] = useState<UserGoals>(defaultGoals)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // Initialize with empty arrays for all tracking data
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [predefinedExercises, setPredefinedExercises] = useState<Exercise[]>(defaultPredefinedExercises)
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements)
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryItem[]>([])

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false)
  const [lastWaterTime, setLastWaterTime] = useState<number>(Date.now())
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now())
  const [dataLoaded, setDataLoaded] = useState(false)

  // Sample food database
  const [foodDatabase] = useState<Food[]>([
    {
      id: "food1",
      name: "Apple",
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      fiber: 2.4,
      sugar: 10.3,
      sodium: 1,
      servingSizes: [
        { name: "small", grams: 100 },
        { name: "medium", grams: 150 },
        { name: "large", grams: 200 },
        { name: "slice", grams: 30 },
      ],
    },
    {
      id: "food2",
      name: "Banana",
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12.2,
      sodium: 1,
      servingSizes: [
        { name: "small", grams: 80 },
        { name: "medium", grams: 120 },
        { name: "large", grams: 150 },
      ],
    },
    {
      id: "food3",
      name: "Chicken Breast",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      servingSizes: [
        { name: "100g", grams: 100 },
        { name: "piece", grams: 120 },
        { name: "ounce", grams: 28 },
      ],
    },
    {
      id: "food4",
      name: "Brown Rice",
      calories: 112,
      protein: 2.6,
      carbs: 23.5,
      fat: 0.9,
      fiber: 1.8,
      sugar: 0.4,
      sodium: 5,
      servingSizes: [
        { name: "cup cooked", grams: 195 },
        { name: "100g", grams: 100 },
        { name: "tablespoon", grams: 15 },
      ],
    },
    {
      id: "food5",
      name: "Salmon",
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      fiber: 0,
      sugar: 0,
      sodium: 59,
      servingSizes: [
        { name: "fillet", grams: 100 },
        { name: "ounce", grams: 28 },
        { name: "100g", grams: 100 },
      ],
    },
    {
      id: "food6",
      name: "Egg",
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      sugar: 1.1,
      sodium: 124,
      servingSizes: [
        { name: "large egg", grams: 50 },
        { name: "small egg", grams: 38 },
        { name: "egg white", grams: 33 },
      ],
    },
    {
      id: "food7",
      name: "Broccoli",
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      sugar: 1.7,
      sodium: 33,
      servingSizes: [
        { name: "cup chopped", grams: 91 },
        { name: "spear", grams: 30 },
        { name: "100g", grams: 100 },
      ],
    },
    {
      id: "food8",
      name: "Greek Yogurt",
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      fiber: 0,
      sugar: 3.6,
      sodium: 36,
      servingSizes: [
        { name: "cup", grams: 245 },
        { name: "tablespoon", grams: 15 },
        { name: "100g", grams: 100 },
      ],
    },
    {
      id: "food9",
      name: "Oatmeal",
      calories: 68,
      protein: 2.4,
      carbs: 12,
      fat: 1.4,
      fiber: 2,
      sugar: 0.5,
      sodium: 2,
      servingSizes: [
        { name: "cup cooked", grams: 234 },
        { name: "cup dry", grams: 81 },
        { name: "tablespoon", grams: 8 },
      ],
    },
    {
      id: "food10",
      name: "Avocado",
      calories: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      fiber: 6.7,
      sugar: 0.7,
      sodium: 7,
      servingSizes: [
        { name: "whole", grams: 200 },
        { name: "half", grams: 100 },
        { name: "slice", grams: 30 },
      ],
    },
    {
      id: "food11",
      name: "Whole Wheat Bread",
      calories: 69,
      protein: 3.6,
      carbs: 12,
      fat: 1.1,
      fiber: 1.9,
      sugar: 1.6,
      sodium: 130,
      servingSizes: [
        { name: "slice", grams: 28 },
        { name: "100g", grams: 100 },
      ],
    },
    {
      id: "food12",
      name: "Milk",
      calories: 42,
      protein: 3.4,
      carbs: 5,
      fat: 1,
      fiber: 0,
      sugar: 5,
      sodium: 44,
      servingSizes: [
        { name: "cup", grams: 244 },
        { name: "tablespoon", grams: 15 },
        { name: "100ml", grams: 100 },
      ],
    },
    {
      id: "food13",
      name: "Almonds",
      calories: 579,
      protein: 21,
      carbs: 22,
      fat: 49,
      fiber: 12.5,
      sugar: 4.4,
      sodium: 1,
      servingSizes: [
        { name: "cup", grams: 95 },
        { name: "ounce", grams: 28 },
        { name: "10 almonds", grams: 12 },
      ],
    },
    {
      id: "food14",
      name: "Spinach",
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      fiber: 2.2,
      sugar: 0.4,
      sodium: 79,
      servingSizes: [
        { name: "cup raw", grams: 30 },
        { name: "cup cooked", grams: 180 },
        { name: "100g", grams: 100 },
      ],
    },
    {
      id: "food15",
      name: "Sweet Potato",
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      fiber: 3,
      sugar: 4.2,
      sodium: 55,
      servingSizes: [
        { name: "medium", grams: 130 },
        { name: "cup cubed", grams: 133 },
        { name: "100g", grams: 100 },
      ],
    },
  ])

  // Function to fetch data from MongoDB
  const fetchDataFromDatabase = async () => {
    if (!token || !user) return

    try {
      const response = await fetch("/api/fitness", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch fitness data")
      }

      const data = await response.json()

      // Update state with data from database
      if (data.profile) setProfile(data.profile)
      if (data.goals) setGoals(data.goals)
      if (data.settings) setSettings(data.settings)
      if (data.waterEntries) setWaterEntries(data.waterEntries)
      if (data.meals) setMeals(data.meals)
      if (data.weightEntries) setWeightEntries(data.weightEntries)
      if (data.workouts) setWorkouts(data.workouts)

      setDataLoaded(true)
    } catch (error) {
      console.error("Error fetching data from database:", error)
    }
  }

  // Function to save data to MongoDB
  const saveDataToDatabase = async () => {
    if (!token || !user) return

    try {
      const fitnessData = {
        profile,
        goals,
        settings,
        waterEntries,
        meals,
        weightEntries,
        workouts,
      }

      const response = await fetch("/api/fitness", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fitnessData),
      })

      if (!response.ok) {
        throw new Error("Failed to save fitness data")
      }

      console.log("Data saved to database successfully")
    } catch (error) {
      console.error("Error saving data to database:", error)
    }
  }

  // Function to sync with database (both fetch and save)
  const syncWithDatabase = async () => {
    await fetchDataFromDatabase()
    await saveDataToDatabase()
  }

  // Load data when user changes
  useEffect(() => {
    if (user && token) {
      fetchDataFromDatabase()
    } else {
      setDataLoaded(true)
    }
  }, [user, token])

  // Save data to database when state changes
  useEffect(() => {
    if (user && token && dataLoaded) {
      const debounce = setTimeout(() => {
        saveDataToDatabase()
      }, 2000) // Debounce to avoid too many requests

      return () => clearTimeout(debounce)
    }
  }, [profile, goals, settings, waterEntries, meals, weightEntries, workouts, user, token, dataLoaded])

  // Enable notifications
  const enableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)
    return granted
  }

  // Search foods
  const searchFoods = (query: string): Food[] => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase().trim()
    return foodDatabase.filter((food) => food.name.toLowerCase().includes(lowerQuery))
  }

  // Get food by name
  const getFoodByName = (name: string): Food | undefined => {
    return foodDatabase.find((food) => food.name.toLowerCase() === name.toLowerCase())
  }

  // Calculate recommended calories based on BMI, weight, height, age, and activity level
  const getRecommendedCalories = (): number => {
    // Basic BMR calculation using Mifflin-St Jeor Equation
    const age = profile.birthdate ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear() : 30
    const isMale = true // This should be part of the profile

    // BMR calculation
    let bmr = 0
    if (isMale) {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age + 5
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age - 161
    }

    // Activity multiplier (default to moderate)
    const activityMultiplier = 1.55 // Moderate activity

    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityMultiplier

    // Round to nearest 50
    return Math.round(tdee / 50) * 50
  }

  // Date-specific data retrieval functions
  const getWaterEntriesForDate = (date: string): WaterEntry[] => {
    const today = getDateString()
    const targetDate = date || today

    // Filter water entries by date (using the timestamp to determine the date)
    return waterEntries.filter((entry) => {
      const entryDate = new Date(entry.timestamp).toISOString().split("T")[0]
      return entryDate === targetDate
    })
  }

  const getWaterTotalForDate = (date: string): number => {
    const entries = getWaterEntriesForDate(date)
    return entries.reduce((total, entry) => total + entry.amount, 0) / 1000 // Convert to liters
  }

  const getMealsForDate = (date: string): Meal[] => {
    const today = getDateString()
    const targetDate = date || today

    // Filter meals by date (using the timestamp to determine the date)
    return meals.filter((meal) => {
      // If meal has timestamp, use it to determine date
      if (meal.timestamp) {
        const mealDate = new Date(meal.timestamp).toISOString().split("T")[0]
        return mealDate === targetDate
      }
      // Otherwise, assume it's for today (this is for backward compatibility)
      return targetDate === today
    })
  }

  const getCaloriesForDate = (date: string): number => {
    const mealsForDate = getMealsForDate(date)
    return mealsForDate.reduce((total, meal) => total + meal.calories, 0)
  }

  const getWeightForDate = (date: string): number | null => {
    // Find weight entries for the specified date
    const entriesForDate = weightEntries.filter((entry) => {
      const entryDate = new Date(entry.timestamp).toISOString().split("T")[0]
      return entryDate === date
    })

    // Return the most recent entry for that date, or null if none exists
    if (entriesForDate.length > 0) {
      const sortedEntries = [...entriesForDate].sort((a, b) => b.timestamp - a.timestamp)
      return sortedEntries[0].weight
    }

    return null
  }

  const getWorkoutsForDate = (date: string): WorkoutEntry[] => {
    return workouts.filter((workout) => {
      // If workout has timestamp, use it to determine date
      if (workout.timestamp) {
        const workoutDate = new Date(workout.timestamp).toISOString().split("T")[0]
        return workoutDate === date
      }
      // Otherwise, check the date string
      return workout.date === date
    })
  }

  // Calculate today's water intake
  const todayWaterTotal = getWaterTotalForDate(getDateString())

  // Calculate today's calories
  const todayCalories = getCaloriesForDate(getDateString())

  // Get current weight
  const currentWeight =
    weightEntries.length > 0 ? weightEntries.sort((a, b) => b.timestamp - a.timestamp)[0].weight : profile.weight

  // Add a function to calculate calorie goal based on weight and diet purpose
  const calculateCalorieGoalBasedOnWeight = (weight: number, dietPurpose: "lose" | "maintain" | "gain"): number => {
    // Basic BMR calculation using Mifflin-St Jeor Equation
    const age = profile.birthdate ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear() : 30
    const isMale = true // This should be part of the profile

    // BMR calculation
    let bmr = 0
    if (isMale) {
      bmr = 10 * weight + 6.25 * profile.height - 5 * age + 5
    } else {
      bmr = 10 * weight + 6.25 * profile.height - 5 * age - 161
    }

    // Activity multiplier (default to moderate)
    const activityMultiplier = 1.55 // Moderate activity

    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityMultiplier

    // Adjust based on diet purpose
    let calorieGoal = tdee
    switch (dietPurpose) {
      case "lose":
        calorieGoal = tdee - 500 // 500 calorie deficit for weight loss
        break
      case "gain":
        calorieGoal = tdee + 500 // 500 calorie surplus for weight gain
        break
      default:
        calorieGoal = tdee // Maintain weight
    }

    // Round to nearest 50
    return Math.round(calorieGoal / 50) * 50
  }

  // Update the updateProfile function to recalculate calories when dietPurpose changes
  const updateProfile = (newProfileData: Partial<UserProfileType>) => {
    const oldProfile = { ...profile }
    setProfile((prev) => ({ ...prev, ...newProfileData }))

    // If weight is updated, add a weight entry
    if (newProfileData.weight && newProfileData.weight !== profile.weight) {
      addWeightEntry(newProfileData.weight)
    } else if (newProfileData.dietPurpose && newProfileData.dietPurpose !== oldProfile.dietPurpose) {
      // If diet purpose changed, recalculate calorie goal
      const newCalorieGoal = calculateCalorieGoalBasedOnWeight(profile.weight, newProfileData.dietPurpose)
      updateGoals({ calories: newCalorieGoal })
    }

    // Add to activity history
    if (Object.keys(newProfileData).length > 0) {
      const newActivity: ActivityHistoryItem = {
        id: generateId(),
        type: "goal",
        title: "Profile Updated",
        description: `Updated profile information`,
        date: "Today",
        timestamp: Date.now(),
      }
      setActivityHistory((prev) => [newActivity, ...prev])
    }
  }

  // Update goals
  const updateGoals = (newGoals: Partial<UserGoals>) => {
    setGoals((prev) => ({ ...prev, ...newGoals }))

    // Add to activity history
    if (Object.keys(newGoals).length > 0) {
      const descriptions = []
      if (newGoals.calories) descriptions.push(`calories: ${newGoals.calories}`)
      if (newGoals.water) descriptions.push(`water: ${newGoals.water}L`)
      if (newGoals.sleep) descriptions.push(`sleep: ${newGoals.sleep}h`)
      if (newGoals.weight) descriptions.push(`target weight: ${newGoals.weight}kg`)

      const newActivity: ActivityHistoryItem = {
        id: generateId(),
        type: "goal",
        title: "Goals Updated",
        description: `Updated ${descriptions.join(", ")}`,
        date: "Today",
        timestamp: Date.now(),
      }
      setActivityHistory((prev) => [newActivity, ...prev])
    }
  }

  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))

    // Apply dark mode
    if (newSettings.darkMode !== undefined) {
      if (newSettings.darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    // Handle notification settings
    if (newSettings.notifications !== undefined && newSettings.notifications) {
      enableNotifications()
    }
  }

  // Add water - updated to support specific date
  const addWater = (amount: number, date?: string) => {
    const now = new Date()
    const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true })
    const targetDate = date || getDateString()

    const newEntry: WaterEntry = {
      id: generateId(),
      amount,
      time,
      timestamp: date ? new Date(date).getTime() : Date.now(),
    }

    setWaterEntries((prev) => [...prev, newEntry])
    setLastWaterTime(Date.now()) // Update last water time

    // Check if goal reached (only for today)
    if (!date || targetDate === getDateString()) {
      const newTotal = todayWaterTotal + amount / 1000
      if (newTotal >= goals.water && todayWaterTotal < goals.water) {
        // Add to activity history
        const newActivity: ActivityHistoryItem = {
          id: generateId(),
          type: "goal",
          title: "Reached Water Goal",
          description: `${newTotal.toFixed(1)}L of ${goals.water}L`,
          date: "Today",
          timestamp: Date.now(),
        }
        setActivityHistory((prev) => [newActivity, ...prev])
      }
    }
  }

  // Edit water entry
  const editWaterEntry = (id: string, amount: number) => {
    setWaterEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, amount } : entry)))
  }

  // Delete water entry
  const deleteWaterEntry = (id: string) => {
    setWaterEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  // Add meal - updated to support specific date
  const addMeal = (meal: Omit<Meal, "id">, date?: string) => {
    const targetDate = date || getDateString()
    const timestamp = date ? new Date(date).getTime() : Date.now()

    const newMeal: Meal = {
      ...meal,
      id: generateId(),
      timestamp,
    }

    setMeals((prev) => [...prev, newMeal])

    // Check if calorie goal reached (only for today)
    if (!date || targetDate === getDateString()) {
      const newTotal = todayCalories + meal.calories
      if (newTotal >= goals.calories && todayCalories < goals.calories) {
        // Add to activity history
        const newActivity: ActivityHistoryItem = {
          id: generateId(),
          type: "goal",
          title: "Reached Calorie Goal",
          description: `${newTotal} of ${goals.calories} calories`,
          date: "Today",
          timestamp: Date.now(),
        }
        setActivityHistory((prev) => [newActivity, ...prev])
      }
    }
  }

  // Edit meal
  const editMeal = (id: string, mealData: Partial<Meal>) => {
    setMeals((prev) => prev.map((meal) => (meal.id === id ? { ...meal, ...mealData } : meal)))
  }

  // Delete meal
  const deleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== id))
  }

  // Add weight entry - updated to support specific date
  const addWeightEntry = (weight: number, date?: string) => {
    const targetDate = date || getDateString()
    const timestamp = date ? new Date(date).getTime() : Date.now()

    const newEntry: WeightEntry = {
      id: generateId(),
      weight,
      date: targetDate,
      timestamp,
    }

    setWeightEntries((prev) => [...prev, newEntry])

    // Only update profile weight if it's today's entry
    if (!date || targetDate === getDateString()) {
      // Update profile weight
      setProfile((prev) => ({ ...prev, weight }))

      // Recalculate calorie goal based on new weight
      const newCalorieGoal = calculateCalorieGoalBasedOnWeight(weight, profile.dietPurpose)
      updateGoals({ calories: newCalorieGoal })

      // Add to activity history
      const previousWeight =
        weightEntries.length > 0 ? weightEntries.sort((a, b) => b.timestamp - a.timestamp)[0].weight : weight

      const difference = weight - previousWeight
      const differenceText = difference === 0 ? "no change" : `${difference > 0 ? "+" : ""}${difference.toFixed(1)} kg`

      const newActivity: ActivityHistoryItem = {
        id: generateId(),
        type: "weight",
        title: "Weight Updated",
        description: `${weight} kg (${differenceText})`,
        date: "Today",
        timestamp: Date.now(),
      }
      setActivityHistory((prev) => [newActivity, ...prev])

      // Check if weight goal reached
      if (Math.abs(weight - goals.weight) <= 0.5 && Math.abs(previousWeight - goals.weight) > 0.5) {
        // Unlock achievement
        setAchievements((prev) =>
          prev.map((achievement) =>
            achievement.id === "5" ? { ...achievement, unlocked: true, date: getDateString() } : achievement,
          ),
        )

        // Add to activity history
        const goalActivity: ActivityHistoryItem = {
          id: generateId(),
          type: "goal",
          title: "Reached Weight Goal",
          description: `Target: ${goals.weight} kg, Current: ${weight} kg`,
          date: "Today",
          timestamp: Date.now(),
        }
        setActivityHistory((prev) => [goalActivity, ...prev])
      }
    }
  }

  // Add workout - updated to support specific date
  const addWorkout = (workout: Omit<WorkoutEntry, "id" | "timestamp">, date?: string) => {
    const targetDate = date || getDateString()
    const timestamp = date ? new Date(date).getTime() : Date.now()

    const newWorkout: WorkoutEntry = {
      ...workout,
      id: generateId(),
      timestamp,
    }

    setWorkouts((prev) => [...prev, newWorkout])

    // Only add to activity history if it's today's workout
    if (!date || targetDate === getDateString()) {
      // Add to activity history
      const newActivity: ActivityHistoryItem = {
        id: generateId(),
        type: "workout",
        title: "Completed Workout",
        description: `${workout.name} (${workout.duration} min)`,
        date: "Today",
        timestamp: Date.now(),
      }
      setActivityHistory((prev) => [newActivity, ...prev])

      // Check if workout achievement should be unlocked
      if (workouts.length + 1 >= 10 && !achievements.find((a) => a.id === "3")?.unlocked) {
        setAchievements((prev) =>
          prev.map((achievement) =>
            achievement.id === "3" ? { ...achievement, unlocked: true, date: getDateString() } : achievement,
          ),
        )
      }
    }
  }

  // Add custom exercise
  const addExercise = (exercise: Omit<Exercise, "id">) => {
    const newExercise: Exercise = {
      ...exercise,
      id: generateId(),
      isCustom: true,
    }

    setPredefinedExercises((prev) => [...prev, newExercise])
  }

  // Get exercise by ID
  const getExerciseById = (id: string) => {
    return predefinedExercises.find((exercise) => exercise.id === id)
  }

  // Calculate BMI
  const calculateUserBMI = () => {
    return calculateBMI(currentWeight, profile.height)
  }

  // Get weekly progress
  const getWeeklyProgress = () => {
    // Calculate weekly water (using actual data now)
    let weeklyWater = 0
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]
      weeklyWater += getWaterTotalForDate(dateString)
    }

    // Count workouts in the last 7 days
    const oneWeekAgo = Date.now() - 86400000 * 7
    const weeklyWorkouts = workouts.filter((workout) => workout.timestamp > oneWeekAgo).length

    // Simplified sleep calculation
    const weeklySleep = 45 // hours per week

    return {
      water: { current: weeklyWater, goal: goals.water * 7 },
      workouts: { current: weeklyWorkouts, goal: 4 },
      sleep: { current: weeklySleep, goal: goals.sleep * 7 },
    }
  }

  // Check for water reminder
  useEffect(() => {
    if (!notificationsEnabled || !settings.notifications) return

    const checkWaterReminder = () => {
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      if (now - lastWaterTime > oneHour) {
        sendWaterReminderNotification()
      }
    }

    const interval = setInterval(checkWaterReminder, 15 * 60 * 1000) // Check every 15 minutes

    return () => clearInterval(interval)
  }, [notificationsEnabled, settings.notifications, lastWaterTime])

  // Check for sedentary reminder
  useEffect(() => {
    if (!notificationsEnabled || !settings.notifications) return

    const checkSedentaryReminder = () => {
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      if (now - lastActivityTime > oneHour) {
        sendSedentaryReminderNotification()
      }
    }

    const interval = setInterval(checkSedentaryReminder, 15 * 60 * 1000) // Check every 15 minutes

    return () => clearInterval(interval)
  }, [notificationsEnabled, settings.notifications, lastActivityTime])

  // Check for calorie intake
  useEffect(() => {
    if (!notificationsEnabled || !settings.notifications) return

    // Only check once per day in the evening
    const checkCalorieIntake = () => {
      const now = new Date()
      const hour = now.getHours()

      // Check at 7 PM
      if (hour === 19) {
        const recommendedCalories = getRecommendedCalories()
        const lowThreshold = recommendedCalories * 0.7 // 70% of recommended
        const highThreshold = recommendedCalories * 1.3 // 130% of recommended

        if (todayCalories < lowThreshold) {
          sendCalorieIntakeNotification("low")
        } else if (todayCalories > highThreshold) {
          sendCalorieIntakeNotification("high")
        }
      }
    }

    const interval = setInterval(checkCalorieIntake, 60 * 60 * 1000) // Check every hour

    return () => clearInterval(interval)
  }, [notificationsEnabled, settings.notifications, todayCalories])

  // Load data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedProfile = localStorage.getItem("fitness_profile")
      const storedGoals = localStorage.getItem("fitness_goals")
      const storedSettings = localStorage.getItem("fitness_settings")
      const storedWaterEntries = localStorage.getItem("fitness_water")
      const storedMeals = localStorage.getItem("fitness_meals")
      const storedWeightEntries = localStorage.getItem("fitness_weight")
      const storedWorkouts = localStorage.getItem("fitness_workouts")
      const storedExercises = localStorage.getItem("fitness_exercises")

      if (storedProfile) setProfile(JSON.parse(storedProfile))
      if (storedGoals) setGoals(JSON.parse(storedGoals))
      if (storedSettings) setSettings(JSON.parse(storedSettings))
      if (storedWaterEntries) setWaterEntries(JSON.parse(storedWaterEntries))
      if (storedMeals) setMeals(JSON.parse(storedMeals))
      if (storedWeightEntries) setWeightEntries(JSON.parse(storedWeightEntries))
      if (storedWorkouts) setWorkouts(JSON.parse(storedWorkouts))
      if (storedExercises) setPredefinedExercises(JSON.parse(storedExercises))

      // Make sure this line is present to set dataLoaded to true after loading data
      setDataLoaded(true)
    }
  }, [])

  // Save data to localStorage when state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fitness_profile", JSON.stringify(profile))
      localStorage.setItem("fitness_goals", JSON.stringify(goals))
      localStorage.setItem("fitness_settings", JSON.stringify(settings))
      localStorage.setItem("fitness_water", JSON.stringify(waterEntries))
      localStorage.setItem("fitness_meals", JSON.stringify(meals))
      localStorage.setItem("fitness_weight", JSON.stringify(weightEntries))
      localStorage.setItem("fitness_workouts", JSON.stringify(workouts))
      localStorage.setItem("fitness_exercises", JSON.stringify(predefinedExercises))
    }
  }, [profile, goals, settings, waterEntries, meals, weightEntries, workouts, predefinedExercises])

  // Apply dark mode on initial load
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.darkMode])

  // Check if user is new or returning
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedProfile = localStorage.getItem("fitness_profile")

      if (!storedProfile) {
        // New user - show onboarding
        console.log("New user detected")
      } else {
        // Returning user - load data
        console.log("Returning user detected")
      }
    }
  }, [])

  // Return context value with new functions
  return (
    <FitnessContext.Provider
      value={{
        // User data
        profile,
        updateProfile,
        goals,
        updateGoals,
        settings,
        updateSettings,

        // Water tracking
        waterEntries,
        todayWaterTotal,
        getWaterEntriesForDate,
        getWaterTotalForDate,
        addWater,
        editWaterEntry,
        deleteWaterEntry,

        // Meals tracking
        meals,
        todayCalories,
        getMealsForDate,
        getCaloriesForDate,
        addMeal,
        editMeal,
        deleteMeal,

        // Weight tracking
        weightEntries,
        currentWeight,
        getWeightForDate,
        addWeightEntry,

        // Workouts
        workouts,
        predefinedExercises,
        getWorkoutsForDate,
        addWorkout,
        addExercise,
        getExerciseById,

        // Achievements and history
        achievements,
        activityHistory,

        // Utility
        calculateBMI: calculateUserBMI,
        getWeeklyProgress,

        // Notification settings
        notificationsEnabled,
        enableNotifications,
        searchFoods,
        getFoodByName,
        getRecommendedCalories,
        dataLoaded,
        syncWithDatabase,
      }}
    >
      {children}
    </FitnessContext.Provider>
  )
}

// Custom hook to use the fitness context
export function useFitness() {
  const context = useContext(FitnessContext)
  if (context === undefined) {
    throw new Error("useFitness must be used within a FitnessProvider")
  }
  return context
}
