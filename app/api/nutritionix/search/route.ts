import { type NextRequest, NextResponse } from "next/server"

// Use server-side environment variables (without NEXT_PUBLIC_ prefix)
const APP_ID = process.env.NUTRITIONIX_APP_ID
const APP_KEY = process.env.NUTRITIONIX_APP_KEY

export async function POST(req: NextRequest) {
  try {
    // Get search query from request body
    const { query } = await req.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid search query" }, { status: 400 })
    }

    // Check if API credentials are available
    if (!APP_ID || !APP_KEY) {
      console.error("Missing Nutritionix API credentials")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Make request to Nutritionix API
    const response = await fetch(
      `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-app-id": APP_ID,
          "x-app-key": APP_KEY,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Nutritionix API error:", errorText)
      return NextResponse.json({ error: `Failed to fetch food data: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error searching foods:", error)
    return NextResponse.json({ error: "An error occurred while searching for foods" }, { status: 500 })
  }
}
