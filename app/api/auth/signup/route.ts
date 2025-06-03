import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import FitnessData from "@/models/FitnessData"
import jwt from "jsonwebtoken"
import { handleMongoDbError } from "@/lib/db-error-handler"

const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret-for-development"

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper function to normalize email
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export async function POST(req: NextRequest) {
  console.log("Starting signup process...")

  try {
    // Parse request body
    const body = await req.json()
    const { name: rawName, email: rawEmail, password } = body

    console.log(`Received signup request for: ${rawEmail}`)

    // Validate required fields with specific messages
    if (!rawName || !rawEmail || !password) {
      return NextResponse.json(
        {
          error: "Missing required field",
          code: "VALIDATION_ERROR",
          field: !rawName ? "name" : !rawEmail ? "email" : "password",
          message: !rawName 
            ? "Please enter your name" 
            : !rawEmail 
            ? "Please enter your email address" 
            : "Please enter a password",
        },
        { status: 400 },
      )
    }

    // Validate name
    const name = rawName.trim()
    if (name.length < 2) {
      return NextResponse.json(
        {
          error: "Invalid name",
          code: "VALIDATION_ERROR",
          field: "name",
          message: "Name must be at least 2 characters long",
        },
        { status: 400 },
      )
    }

    // Normalize and validate email
    const email = normalizeEmail(rawEmail)
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
          code: "VALIDATION_ERROR",
          field: "email",
          message: "Please enter a valid email address",
        },
        { status: 400 },
      )
    }

    // Validate password with specific requirements
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password too short",
          code: "VALIDATION_ERROR",
          field: "password",
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Connect to database with better error handling
    console.log("Connecting to database...")
    try {
      await connectToDatabase()
    } catch (error) {
      console.error("Database connection error:", error)
      return NextResponse.json(
        {
          error: "Connection failed",
          code: "CONNECTION_ERROR",
          message: "Unable to connect to the server. Please try again later.",
        },
        { status: 503 },
      )
    }

    // Check if user already exists - with case-insensitive query
    console.log("Checking if user exists...")
    try {
      const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } })

      if (existingUser) {
        console.log("User already exists with email:", email)
        return NextResponse.json(
          {
            error: "Account exists",
            code: "DUPLICATE_EMAIL",
            field: "email",
            message: "An account already exists with this email address. Please try logging in instead.",
          },
          { status: 409 },
        )
      }
    } catch (error) {
      console.error("Error checking existing user:", error)
      const dbError = handleMongoDbError(error)
      return NextResponse.json(
        {
          error: dbError.code,
          message: dbError.message,
          field: dbError.field,
        },
        { status: dbError.status },
      )
    }

    // Create new user with error handling
    console.log("Creating new user...")
    let user
    try {
      user = new User({ name, email, password })
      await user.save()
      console.log("User created successfully with ID:", user._id)
    } catch (error) {
      console.error("Error creating user:", error)
      const dbError = handleMongoDbError(error)

      if (dbError.code === "DUPLICATE_KEY") {
        return NextResponse.json(
          {
            error: "Account exists",
            code: "DUPLICATE_EMAIL",
            field: "email",
            message: "An account already exists with this email address. Please try logging in instead.",
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        {
          error: dbError.code,
          message: dbError.message,
          field: dbError.field,
        },
        { status: dbError.status },
      )
    }

    // Create initial fitness data
    console.log("Creating fitness data...")
    try {
      const fitnessData = new FitnessData({
        userId: user._id,
        profile: {
          name: user.name,
          email: user.email,
        },
      })
      await fitnessData.save()
      console.log("Fitness data created successfully")
    } catch (error) {
      console.error("Error creating fitness data:", error)
      // Try to clean up the created user
      try {
        await User.deleteOne({ _id: user._id })
        console.log("Rolled back user creation")
      } catch (rollbackError) {
        console.error("Failed to rollback user creation:", rollbackError)
      }

      return NextResponse.json(
        {
          error: "REGISTRATION_ERROR",
          message: "Failed to complete registration. Please try again.",
        },
        { status: 500 },
      )
    }

    // Generate JWT token with error handling
    let token
    try {
      token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })
    } catch (error) {
      console.error("Error generating token:", error)

      // Clean up created data
      try {
        await FitnessData.deleteOne({ userId: user._id })
        await User.deleteOne({ _id: user._id })
        console.log("Rolled back user and fitness data creation")
      } catch (rollbackError) {
        console.error("Failed to rollback data creation:", rollbackError)
      }

      return NextResponse.json(
        {
          error: "REGISTRATION_ERROR",
          message: "Failed to complete registration. Please try again.",
        },
        { status: 500 },
      )
    }

    console.log("Signup process completed successfully for:", email)

    return NextResponse.json({
      message: "Registration successful! Welcome to our fitness community.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedOnboarding: false,
      },
      token,
    })
  } catch (error) {
    console.error("Unexpected signup error:", error)
    return NextResponse.json(
      {
        error: "REGISTRATION_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 },
    )
  }
}
