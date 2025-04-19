export type Meal = {
  id: string
  name: string
  calories: number
  portion: string
  time: string
  category: "breakfast" | "lunch" | "dinner" | "snack"
  nutrition?: {
    carbs: number
    protein: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  timestamp?: number
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
