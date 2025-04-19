import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import crypto from "crypto"

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

    // In a production environment, you would send an email here
    // For demonstration purposes, we'll set up a basic email configuration
    // but comment it out to avoid actual email sending during testing

    /*
    // Create a test email account or use your own SMTP settings
    const transporter = nodemailer.createTransport({
      host: "smtp.example.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "your-email@example.com",
        pass: "your-password",
      },
    });

    // Send email
    await transporter.sendMail({
      from: '"Fitness App" <noreply@fitnessapp.com>',
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
          <p>Regards,<br>The Fitness App Team</p>
        </div>
      `,
    });
    */

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
