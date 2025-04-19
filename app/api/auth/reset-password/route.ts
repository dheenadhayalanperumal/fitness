import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    // Get data from request
    const { token, email, password } = await req.json()

    // Validate inputs
    if (!token || !email || !password) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          message: "Token, email, and password are required",
        },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Invalid password",
          field: "password",
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Connect to database
    await connectToDatabase()

    // Hash the token for comparison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with matching token and email
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, "i") },
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    })

    // If no user found or token expired
    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid token",
          message: "Password reset link is invalid or has expired",
        },
        { status: 400 },
      )
    }

    // Update password
    user.password = password

    // Clear reset token fields
    user.resetToken = undefined
    user.resetTokenExpiry = undefined

    // Save user
    await user.save()

    // Return success response
    return NextResponse.json({
      message: "Password has been reset successfully",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: "An error occurred while resetting your password",
      },
      { status: 500 },
    )
  }
}
