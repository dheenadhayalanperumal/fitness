export type Meal = {
  id: string
  name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  time?: string
  timestamp: number
}

export type WaterEntry = {
  id: string
  amount: number // in milliliters
  time: string
  timestamp: number
}

export type Exercise = {
  id: string
  name: string
  category: "strength" | "cardio" | "flexibility" | "sports"
  caloriesPerMinute: number
  isCustom?: boolean
}

export type ExerciseSet = {
  id: string
  reps?: number
  weight?: number
  duration?: number // in minutes
  distance?: number // in km
}

export type WorkoutExercise = {
  id: string
  exerciseId: string
  exerciseName: string
  category: "strength" | "cardio" | "flexibility" | "sports" | "other"
  sets: ExerciseSet[]
  notes?: string
  caloriesBurned: number
}

export type WorkoutEntry = {
  id: string
  name: string
  type: string
  duration: number // in minutes
  calories: number
  exercises: {
    id: string
    name: string
    sets?: number
    reps?: number
    weight?: number
    duration?: number // in minutes
  }[]
  date?: string
  timestamp: number
}

export type WeightEntry = {
  id: string
  weight: number
  date: string
  timestamp: number
}

export type StepEntry = {
  id: string
  count: number
  date: string
  timestamp: number
}

export type UserProfile = {
  name: string
  email: string
  height: number
  weight: number
  birthdate: string
  profileImage?: string
}

export type UserGoals = {
  calories: number
  water: number // in liters
  sleep: number // in hours
  weight: number // target weight in kg
}

export type AppSettings = {
  darkMode: boolean
  notifications: boolean
  healthSync: boolean
}

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  color: string
  unlocked: boolean
  date?: string
}

export type ActivityHistoryItem = {
  id: string
  type: "water" | "meal" | "workout" | "weight" | "goal"
  title: string
  description: string
  date: string
  timestamp: number
}

export type Food = {
  id: string
  name: string
  calories: number // per 100g
  protein: number // per 100g
  carbs: number // per 100g
  fat: number // per 100g
  fiber?: number // per 100g
  sugar?: number // per 100g
  sodium?: number // per 100g
  servingSizes: {
    name: string // e.g., "cup", "piece", "slice"
    grams: number // weight in grams
  }[]
}
