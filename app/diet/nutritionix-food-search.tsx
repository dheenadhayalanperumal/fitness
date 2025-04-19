"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Food } from "@/lib/types"

// Define types for Nutritionix API responses
interface NutritionixFood {
  food_name: string
  serving_unit: string
  serving_qty: number
  photo: {
    thumb: string
  }
  nf_calories?: number
  brand_name?: string
  tag_name?: string
}

interface NutritionixResponse {
  common: NutritionixFood[]
  branded: NutritionixFood[]
}

interface NutritionixNutrients {
  nf_calories: number
  nf_total_carbohydrate: number
  nf_protein: number
  nf_total_fat: number
  nf_dietary_fiber?: number
  nf_sugars?: number
  nf_sodium?: number
  serving_weight_grams: number
  serving_qty: number
  serving_unit: string
  alt_measures?: {
    serving_weight: number
    measure: string
    seq: number
    qty: number
  }[]
}

interface FoodSearchProps {
  onSelectFood: (food: Food, servingSize: string, quantity: number, nutrition: any) => void
  onClose: () => void
  mealCategory?: "breakfast" | "lunch" | "dinner" | "snack"
}

export default function NutritionixFoodSearch({ onSelectFood, onClose, mealCategory = "snack" }: FoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<NutritionixFood[]>([])
  const [selectedFood, setSelectedFood] = useState<NutritionixFood | null>(null)
  const [foodDetails, setFoodDetails] = useState<NutritionixNutrients | null>(null)
  const [servingSize, setServingSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // Debounced search function
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      handleSearch()
    }, 500)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [searchQuery])

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("Searching for:", searchQuery)

      // Use our server API route instead of calling Nutritionix directly
      const response = await fetch("/api/nutritionix/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      console.log("Search response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API error:", errorData)
        throw new Error(errorData.error || `Failed to fetch food data: ${response.status}`)
      }

      const data: NutritionixResponse = await response.json()
      console.log("Search results:", {
        common: data.common?.length || 0,
        branded: data.branded?.length || 0,
      })

      // Combine common and branded foods
      const combinedResults = [...(data.common || []).slice(0, 10), ...(data.branded || []).slice(0, 10)]

      setSearchResults(combinedResults)
    } catch (err) {
      console.error("Error searching foods:", err)
      setError(`Failed to search foods: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFoodDetails = async (food: NutritionixFood) => {
    setIsLoadingDetails(true)
    setError(null)

    try {
      console.log("Fetching details for:", food.food_name)

      // Use our server API route instead of calling Nutritionix directly
      const response = await fetch("/api/nutritionix/nutrients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: food.food_name }),
      })

      console.log("Details response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API error:", errorData)
        throw new Error(errorData.error || `Failed to fetch food details: ${response.status}`)
      }

      const data = await response.json()
      console.log("Food details:", data)

      if (data.foods && data.foods.length > 0) {
        setFoodDetails(data.foods[0])

        // Set default serving size
        if (data.foods[0].alt_measures && data.foods[0].alt_measures.length > 0) {
          setServingSize(data.foods[0].serving_unit)
        } else {
          setServingSize("g")
        }
      }
    } catch (err) {
      console.error("Error fetching food details:", err)
      setError(`Failed to fetch food details: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleFoodSelect = (food: NutritionixFood) => {
    setSelectedFood(food)
    fetchFoodDetails(food)
  }

  const getServingSizes = () => {
    if (!foodDetails) return []

    const servingSizes = [{ name: foodDetails.serving_unit, grams: foodDetails.serving_weight_grams }]

    // Add gram option if not already included
    if (foodDetails.serving_unit !== "g") {
      servingSizes.push({ name: "g", grams: 1 })
    }

    // Add alternative measures
    if (foodDetails.alt_measures) {
      foodDetails.alt_measures.forEach((measure) => {
        if (!servingSizes.some((size) => size.name === measure.measure)) {
          servingSizes.push({ name: measure.measure, grams: measure.serving_weight / measure.qty })
        }
      })
    }

    return servingSizes
  }

  // Fixed calculation function to ensure consistent nutrition values
  const calculateNutrition = () => {
    if (!foodDetails || !servingSize) return null

    const servingSizes = getServingSizes()
    const selectedSize = servingSizes.find((size) => size.name === servingSize)

    if (!selectedSize) return null

    // Calculate the ratio based on the selected serving size and quantity
    let ratio = 1

    // For the default serving size (what's shown in the API response)
    if (servingSize === foodDetails.serving_unit) {
      ratio = quantity
    } else {
      // For other serving sizes, calculate based on weight ratio
      ratio = (selectedSize.grams * quantity) / foodDetails.serving_weight_grams
    }

    // Calculate nutrition values with the ratio
    return {
      calories: Math.round(foodDetails.nf_calories * ratio),
      carbs: Math.round(foodDetails.nf_total_carbohydrate * ratio * 10) / 10,
      protein: Math.round(foodDetails.nf_protein * ratio * 10) / 10,
      fat: Math.round(foodDetails.nf_total_fat * ratio * 10) / 10,
      fiber: foodDetails.nf_dietary_fiber ? Math.round(foodDetails.nf_dietary_fiber * ratio * 10) / 10 : undefined,
      sugar: foodDetails.nf_sugars ? Math.round(foodDetails.nf_sugars * ratio * 10) / 10 : undefined,
      sodium: foodDetails.nf_sodium ? Math.round(foodDetails.nf_sodium * ratio) : undefined,
    }
  }

  // Fixed handleAddFood function to ensure the displayed nutrition values match what's saved
  const handleAddFood = () => {
    if (!selectedFood || !foodDetails || !servingSize) return

    // Get the calculated nutrition based on serving size and quantity
    const nutrition = calculateNutrition()
    if (!nutrition) return

    const servingSizes = getServingSizes()
    const selectedSize = servingSizes.find((size) => size.name === servingSize)
    if (!selectedSize) return

    // Create a food object with the base nutrition values (per standard serving)
    const food: Food = {
      id: `nutritionix-${Date.now()}`,
      name: selectedFood.food_name,
      // These are the base values per standard serving - not what will be saved
      calories: foodDetails.nf_calories,
      protein: foodDetails.nf_protein,
      carbs: foodDetails.nf_total_carbohydrate,
      fat: foodDetails.nf_total_fat,
      fiber: foodDetails.nf_dietary_fiber,
      sugar: foodDetails.nf_sugars,
      sodium: foodDetails.nf_sodium,
      servingSizes: servingSizes.map((size) => ({
        name: size.name,
        grams: size.grams,
      })),
    }

    // Log the values for debugging
    console.log("Adding food with nutrition:", {
      displayedCalories: nutrition.calories,
      baseCalories: foodDetails.nf_calories,
      quantity,
      servingSize,
      servingSizeGrams: selectedSize.grams,
      standardServingGrams: foodDetails.serving_weight_grams,
    })

    // Pass the calculated nutrition values to ensure what's displayed is what's saved
    onSelectFood(food, servingSize, quantity, nutrition)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedFood ? selectedFood.food_name : `Search Foods (${mealCategory})`}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {!selectedFood ? (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search for a food..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-8"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleSearch} disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {searchResults.map((food, index) => (
                      <Button
                        key={`${food.food_name}-${index}`}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => handleFoodSelect(food)}
                      >
                        <div className="flex items-center w-full">
                          {food.photo?.thumb && (
                            <img
                              src={food.photo.thumb || "/placeholder.svg"}
                              alt={food.food_name}
                              className="h-10 w-10 object-cover rounded-md mr-3"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          )}
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{food.food_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {food.serving_qty} {food.serving_unit}
                              {food.brand_name ? ` • ${food.brand_name}` : ""}
                              {food.nf_calories ? ` • ${food.nf_calories} kcal` : ""}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 && !isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No foods found. Try a different search term.
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {isLoadingDetails ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : foodDetails ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        {selectedFood.photo?.thumb && (
                          <img
                            src={selectedFood.photo.thumb || "/placeholder.svg"}
                            alt={selectedFood.food_name}
                            className="h-12 w-12 object-cover rounded-md mr-3"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                            }}
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{selectedFood.food_name}</h3>
                          {selectedFood.brand_name && (
                            <p className="text-sm text-muted-foreground">{selectedFood.brand_name}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {foodDetails.nf_calories} kcal per {foodDetails.serving_qty} {foodDetails.serving_unit} •
                        {foodDetails.nf_protein}g protein • {foodDetails.nf_total_carbohydrate}g carbs •{" "}
                        {foodDetails.nf_total_fat}g fat
                      </p>
                      {(foodDetails.nf_dietary_fiber || foodDetails.nf_sugars || foodDetails.nf_sodium) && (
                        <p className="text-sm text-muted-foreground">
                          {foodDetails.nf_dietary_fiber ? `${foodDetails.nf_dietary_fiber}g fiber • ` : ""}
                          {foodDetails.nf_sugars ? `${foodDetails.nf_sugars}g sugar • ` : ""}
                          {foodDetails.nf_sodium ? `${foodDetails.nf_sodium}mg sodium` : ""}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serving-size">Serving Size</Label>
                        <Select value={servingSize} onValueChange={setServingSize}>
                          <SelectTrigger id="serving-size">
                            <SelectValue placeholder="Select serving size" />
                          </SelectTrigger>
                          <SelectContent>
                            {getServingSizes().map((size) => (
                              <SelectItem key={size.name} value={size.name}>
                                {size.name} ({size.grams}g)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={0.25}
                          step={0.25}
                          value={quantity}
                          onChange={(e) => setQuantity(Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {calculateNutrition() && (
                      <div className="rounded-lg bg-muted p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Calories:</span>
                          <span className="font-medium">{calculateNutrition()?.calories} kcal</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>Carbs: {calculateNutrition()?.carbs}g</div>
                          <div>Protein: {calculateNutrition()?.protein}g</div>
                          <div>Fat: {calculateNutrition()?.fat}g</div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setSelectedFood(null)}>
                        Back
                      </Button>
                      <Button
                        className="bg-[#27AE60] hover:bg-[#219653]"
                        onClick={handleAddFood}
                        disabled={!servingSize || quantity <= 0}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Add Food
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {error || "Failed to load food details. Please try again."}
                    <Button variant="outline" className="mt-2" onClick={() => setSelectedFood(null)}>
                      Back to Search
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
