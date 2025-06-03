import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import FitnessData from "@/models/FitnessData"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password } = await req.json()

    // Validate input
    if (!rawEmail || !password) {
      return NextResponse.json(
        {
          error: "Missing credentials",
          message: !rawEmail ? "Email is required" : "Password is required",
          code: "VALIDATION_ERROR",
          field: !rawEmail ? "email" : "password"
        },
        { status: 400 },
      )
    }

    // Normalize email
    const email = rawEmail.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Invalid email",
          message: "Please enter a valid email address",
          code: "VALIDATION_ERROR",
          field: "email"
        },
        { status: 400 },
      )
    }

    // Connect to database
    try {
      await connectToDatabase()
    } catch (error) {
      console.error("Database connection error:", error)
      return NextResponse.json(
        {
          error: "Server error",
          message: "Unable to connect to the server. Please try again later.",
          code: "CONNECTION_ERROR"
        },
        { status: 503 },
      )
    }

    // Find user by email - case insensitive
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } })
    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "No account found with this email address. Please check your email or create an account.",
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
          message: "Incorrect password. Please try again or use 'Forgot Password' if you need to reset it.",
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
        message: "An unexpected error occurred. Please try again later.",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}
