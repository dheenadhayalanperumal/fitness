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

// Helper function to normalize email (convert to lowercase)
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(req: NextRequest) {
  console.log("Starting signup process...")

  try {
    // Parse request body
    const body = await req.json()
    const { name, email: rawEmail, password } = body

    console.log(`Received signup request for: ${rawEmail}`)

    // Validate required fields
    if (!name || !rawEmail || !password) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          code: "VALIDATION_ERROR",
          message: "Name, email, and password are required.",
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
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      )
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password too short",
          code: "VALIDATION_ERROR",
          field: "password",
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 },
      )
    }

    // Connect to database
    console.log("Connecting to database...")
    try {
      await connectToDatabase()
    } catch (error) {
      console.error("Database connection error:", error)
      return NextResponse.json(
        {
          error: "Database connection failed",
          code: "CONNECTION_ERROR",
          message: "Unable to connect to the database. Please try again later.",
        },
        { status: 503 },
      )
    }

    // Check if user already exists - with case-insensitive query
    console.log("Checking if user exists...")
    let existingUser
    try {
      // Use a case-insensitive query to check for existing email
      existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } })

      if (existingUser) {
        console.log("User already exists with email:", email)
        return NextResponse.json(
          {
            error: "Email already in use",
            code: "DUPLICATE_EMAIL",
            field: "email",
            message: "This email address is already registered. Please use a different email or try logging in.",
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
      // Create a clean user object with only the fields we need
      const userData = {
        name,
        email,
        password,
      }

      user = new User(userData)
      await user.save()
      console.log("User created successfully with ID:", user._id)
    } catch (error) {
      console.error("Error creating user:", error)
      const dbError = handleMongoDbError(error)

      // Special handling for duplicate key errors
      if (dbError.code === "DUPLICATE_KEY") {
        // If the field is username but we're not using username, it's likely an email conflict
        if (dbError.field === "username") {
          return NextResponse.json(
            {
              error: "Email already in use",
              code: "DUPLICATE_EMAIL",
              field: "email",
              message: "This email address is already registered. Please use a different email or try logging in.",
            },
            { status: 409 },
          )
        }

        return NextResponse.json(
          {
            error: `${dbError.field} already in use`,
            code: "DUPLICATE_FIELD",
            field: dbError.field,
            message: dbError.message,
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

    // Create initial fitness data with error handling
    console.log("Creating fitness data...")
    try {
      const fitnessData = new FitnessData({
        userId: user._id,
        profile: {
          name,
          email,
          height: 175,
          weight: 70,
          birthdate: "",
          dietPurpose: "maintain",
        },
        goals: {
          steps: 10000,
          calories: 2000,
          water: 2.5,
          sleep: 8,
          weight: 70,
        },
        settings: {
          darkMode: false,
          notifications: true,
          healthSync: false,
        },
      })
      await fitnessData.save()
      console.log("Fitness data created successfully")
    } catch (error) {
      console.error("Error creating fitness data:", error)

      // Try to delete the user if fitness data creation fails
      try {
        await User.deleteOne({ _id: user._id })
        console.log("Rolled back user creation")
      } catch (rollbackError) {
        console.error("Failed to rollback user creation:", rollbackError)
      }

      const dbError = handleMongoDbError(error)
      return NextResponse.json(
        {
          error: dbError.code,
          message: "Failed to create user profile. Please try again.",
          details: dbError.message,
        },
        { status: dbError.status },
      )
    }

    // Generate JWT token with error handling
    console.log("Generating JWT token...")
    let token
    try {
      token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })
    } catch (error) {
      console.error("Error generating token:", error)

      // Try to clean up created data
      try {
        await FitnessData.deleteOne({ userId: user._id })
        await User.deleteOne({ _id: user._id })
        console.log("Rolled back user and fitness data creation")
      } catch (rollbackError) {
        console.error("Failed to rollback data creation:", rollbackError)
      }

      return NextResponse.json(
        {
          error: "TOKEN_ERROR",
          message: "Failed to generate authentication token. Please try again.",
        },
        { status: 500 },
      )
    }

    console.log("Signup process completed successfully for:", email)

    // Return user data and token
    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedOnboarding: false, // Explicitly set to false for new users
      },
      token,
    })
  } catch (error) {
    console.error("Unexpected signup error:", error)
    return NextResponse.json(
      {
        error: "REGISTRATION_ERROR",
        message: "An unexpected error occurred during registration. Please try again.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
