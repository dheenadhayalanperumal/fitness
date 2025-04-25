import { type NextRequest, NextResponse } from "next/server"
import { sendTestEmail, createTitanMailTransporter } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    console.log(`Test email requested for: ${email}`)

    // Email configuration
    const emailUser = process.env.EMAIL_USER
    const emailPassword = process.env.EMAIL_PASSWORD

    if (!emailUser || !emailPassword) {
      console.error("Email credentials not configured")
      return NextResponse.json(
        {
          error: "Configuration error",
          message: "Email service not properly configured",
          details: {
            emailUser: emailUser ? "Set" : "Not set",
            emailPassword: emailPassword ? "Set" : "Not set",
          },
        },
        { status: 500 },
      )
    }

    // Verify SMTP connection first
    try {
      console.log("Verifying SMTP connection...")
      const transporter = createTitanMailTransporter()
      await transporter.verify()
      console.log("SMTP connection verified successfully")
    } catch (verifyError: any) {
      console.error("SMTP verification failed:", verifyError)

      // Log detailed error information
      const errorDetails = {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        response: verifyError.response,
        responseCode: verifyError.responseCode,
      }

      console.error("Error details:", errorDetails)

      return NextResponse.json(
        {
          error: "SMTP verification failed",
          message: "Could not connect to email server",
          details: errorDetails,
        },
        { status: 500 },
      )
    }

    // Send test email using our centralized service
    console.log("Sending test email...")
    const emailResult = await sendTestEmail(email)

    if (emailResult.success) {
      console.log("Test email sent successfully:", emailResult.messageId)

      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        details: emailResult.info,
      })
    } else {
      console.error("Failed to send test email:", emailResult.error)

      return NextResponse.json(
        {
          error: "Email sending failed",
          message: "Failed to send test email",
          details: emailResult.details,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in test email endpoint:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
