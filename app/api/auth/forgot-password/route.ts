import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    console.log("Password reset request initiated")

    // Get email from request
    const { email } = await req.json()
    console.log(`Password reset requested for email: ${email}`)

    // Validate email
    if (!email || typeof email !== "string") {
      console.log("Invalid email format provided")
      return NextResponse.json(
        {
          error: "Invalid email",
          field: "email",
          message: "Please provide a valid email address",
        },
        { status: 400 },
      )
    }

    // Connect to database
    console.log("Connecting to database...")
    try {
      await connectToDatabase()
      console.log("Database connection successful")
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json(
        {
          error: "Database error",
          message: "Failed to connect to the database",
        },
        { status: 500 },
      )
    }

    // Find user by email (case-insensitive)
    console.log(`Searching for user with email: ${email}`)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, "i") },
    })

    // If no user found, we still return success for security reasons
    if (!user) {
      console.log(`User not found for email: ${email}`)
      return NextResponse.json({
        message: "If an account with that email exists, we've sent a password reset link",
      })
    }

    console.log(`User found: ${user._id}`)

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set token expiry (1 hour from now)
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    // Save token to user
    console.log("Saving reset token to user")
    try {
      user.resetToken = hashedToken
      user.resetTokenExpiry = tokenExpiry
      await user.save()
      console.log("Reset token saved successfully")
    } catch (tokenError) {
      console.error("Failed to save reset token:", tokenError)
      return NextResponse.json(
        {
          error: "Token error",
          message: "Failed to generate reset token",
        },
        { status: 500 },
      )
    }

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
    console.log("Reset URL generated:", resetUrl)

    // Send password reset email using our centralized service
    console.log("Sending password reset email...")
    const emailResult = await sendPasswordResetEmail(email, resetUrl)

    if (emailResult.success) {
      console.log("Password reset email sent successfully:", emailResult.messageId)
    } else {
      console.error("Failed to send password reset email:", emailResult.error)
      console.error("Error details:", emailResult.details)
      // We don't return an error to the client for security reasons
    }

    // Return success response
    console.log("Password reset process completed, returning success response")
    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link",
    })
  } catch (error) {
    console.error("Unhandled error in password reset process:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: "An error occurred while processing your request",
      },
      { status: 500 },
    )
  }
}
