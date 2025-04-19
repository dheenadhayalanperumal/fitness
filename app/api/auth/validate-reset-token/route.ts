import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    // Get token and email from query params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    // Validate params
    if (!token || !email) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          message: "Token and email are required",
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

    // Token is valid
    return NextResponse.json({
      message: "Token is valid",
    })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: "An error occurred while validating the token",
      },
      { status: 500 },
    )
  }
}
