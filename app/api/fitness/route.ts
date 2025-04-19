import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import FitnessData from "@/models/FitnessData"
import { verifyToken } from "@/lib/auth"

// GET - Retrieve user's fitness data
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyToken(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Find fitness data for user
    const fitnessData = await FitnessData.findOne({ userId })
    if (!fitnessData) {
      return NextResponse.json({ error: "Fitness data not found" }, { status: 404 })
    }

    return NextResponse.json(fitnessData)
  } catch (error) {
    console.error("Error retrieving fitness data:", error)
    return NextResponse.json({ error: "An error occurred while retrieving fitness data" }, { status: 500 })
  }
}

// PUT - Update user's fitness data
export async function PUT(req: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyToken(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get data from request
    const updateData = await req.json()

    // Connect to database
    await connectToDatabase()

    // Find and update fitness data
    const fitnessData = await FitnessData.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true },
    )

    return NextResponse.json({
      message: "Fitness data updated successfully",
      data: fitnessData,
    })
  } catch (error) {
    console.error("Error updating fitness data:", error)
    return NextResponse.json({ error: "An error occurred while updating fitness data" }, { status: 500 })
  }
}
