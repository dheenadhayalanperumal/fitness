import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import crypto from "crypto"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    // Get email from request
    const { email } = await req.json()

    // Validate email
    if (!email || typeof email !== "string") {
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
    await connectToDatabase()

    // Find user by email (case-insensitive)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, "i") },
    })

    // If no user found, we still return success for security reasons
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`)

      // Return success even though no email will be sent
      return NextResponse.json({
        message: "If an account with that email exists, we've sent a password reset link",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set token expiry (1 hour from now)
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    // Save token to user
    user.resetToken = hashedToken
    user.resetTokenExpiry = tokenExpiry
    await user.save()

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Log the reset URL for testing purposes
    console.log("Password reset link:", resetUrl)

    // Configure Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "titan",
      host: "smtp.titan.email",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com", // Your Gmail address
        pass: process.env.EMAIL_PASSWORD || "your-app-password", // Your Gmail password or App Password
      },
    })

    try {
      // Send email
      const info = await transporter.sendMail({
      from: `"Fitness App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #27AE60;">Password Reset Request</h2>
            <p>You requested a password reset for your Fitness App account.</p>
            <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #27AE60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>Regards,<br/>The Fitness App Team</p>
          </div>
        `,
      })

      console.log("Email sent successfully:", info.messageId)
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      // We don't want to return an error to the client if email sending fails
      // for security reasons, but we log it for debugging
    }

    // Return success response
    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link",
    })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: "An error occurred while processing your request",
      },
      { status: 500 },
    )
  }
}
