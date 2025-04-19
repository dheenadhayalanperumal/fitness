import { type NextRequest, NextResponse } from "next/server"

// Use server-side environment variables (without NEXT_PUBLIC_ prefix)
const APP_ID = process.env.NUTRITIONIX_APP_ID
const APP_KEY = process.env.NUTRITIONIX_APP_KEY

export async function POST(req: NextRequest) {
  try {
    // Get food name from request body
    const { query } = await req.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid food query" }, { status: 400 })
    }

    // Check if API credentials are available
    if (!APP_ID || !APP_KEY) {
      console.error("Missing Nutritionix API credentials")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Make request to Nutritionix API
    const response = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": APP_ID,
        "x-app-key": APP_KEY,
      },
      body: JSON.stringify({
        query,
        num_servings: 1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Nutritionix API error:", errorText)
      return NextResponse.json(
        { error: `Failed to fetch food details: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching food details:", error)
    return NextResponse.json({ error: "An error occurred while fetching food details" }, { status: 500 })
  }
}
