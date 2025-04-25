import nodemailer from "nodemailer"

// Centralized email configuration for Titan Mail
export const createTitanMailTransporter = () => {
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD

  if (!emailUser || !emailPassword) {
    throw new Error("Email credentials not configured")
  }

  // Create transporter for Titan Mail
  return nodemailer.createTransport({
    host: "smtp.titan.email",
    port: 465,
    secure: true, // true for 465 port
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    debug: process.env.NODE_ENV !== "production", // Enable debug in non-production
    logger: process.env.NODE_ENV !== "production", // Log in non-production
  })
}

// Utility function to send an email with error handling
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html: string
}) => {
  try {
    const transporter = createTitanMailTransporter()
    const emailUser = process.env.EMAIL_USER

    if (!emailUser) {
      throw new Error("Sender email not configured")
    }

    // Verify connection
    await transporter.verify()

    // Send email
    const info = await transporter.sendMail({
      from: `"Fitness App" <${emailUser}>`,
      to,
      subject,
      text,
      html,
    })

    console.log("Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId, info }
  } catch (error: any) {
    console.error("Failed to send email:", error)

    // Log detailed error information
    if (error.code) console.error("Error code:", error.code)
    if (error.command) console.error("Failed command:", error.command)
    if (error.response) console.error("Server response:", error.response)
    if (error.responseCode) console.error("Response code:", error.responseCode)

    return {
      success: false,
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      },
    }
  }
}

// Function to send password reset email
export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  return sendEmail({
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
  })
}

// Function to send test email
export const sendTestEmail = async (email: string) => {
  return sendEmail({
    to: email,
    subject: "Email Test",
    text: "This is a test email from your Fitness App.",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27AE60;">Test Email</h2>
        <p>This is a test email from your Fitness App.</p>
        <p>If you received this email, your email configuration is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
    `,
  })
}
