import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import FitnessData from "@/models/FitnessData"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Missing credentials",
          message: "Email and password are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    // Connect to database
    await connectToDatabase()

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "Email not found. Please check your email or create an account.",
          code: "AUTH_ERROR",
          field: "email",
        },
        { status: 401 },
      )
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: "Invalid password",
          message: "Invalid password. Please try again.",
          code: "AUTH_ERROR",
          field: "password",
        },
        { status: 401 },
      )
    }

    // Find fitness data to check if onboarding is completed
    const fitnessData = await FitnessData.findOne({ userId: user._id })
    const hasCompletedOnboarding =
      fitnessData && fitnessData.profile && fitnessData.profile.name && fitnessData.profile.name !== "John Doe"

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    // Return user data and token
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedOnboarding,
      },
      token,
    })
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: "An error occurred during login",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}
