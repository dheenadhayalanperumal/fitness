import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import FitnessData from "@/models/FitnessData"
import { verifyAuth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const fitnessData = await FitnessData.findOne({ userId })
    if (!fitnessData) {
      return NextResponse.json({ error: "Fitness data not found" }, { status: 404 })
    }

    // Get today's date at midnight UTC
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Calculate today's totals
    const todayWaterTotal = fitnessData.waterLog
      .filter((entry) => new Date(entry.timestamp) >= today)
      .reduce((total, entry) => total + entry.amount, 0)

    const todayCalories = fitnessData.caloriesLog
      .filter((entry) => new Date(entry.timestamp) >= today)
      .reduce((total, entry) => total + entry.amount, 0)

    // Get current weight (most recent entry)
    const currentWeight = fitnessData.weightLog.length > 0 
      ? fitnessData.weightLog[fitnessData.weightLog.length - 1].weight 
      : fitnessData.profile.weight || 0

    return NextResponse.json({
      profile: fitnessData.profile,
      goals: fitnessData.goals,
      todayWaterTotal,
      todayCalories,
      currentWeight,
    })
  } catch (error) {
    console.error("Error fetching fitness data:", error)
    return NextResponse.json(
      { error: "Failed to fetch fitness data" },
      { status: 500 },
    )
  }
} 