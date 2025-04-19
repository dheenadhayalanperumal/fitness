import { NextResponse } from "next/server"
import { connectToDatabase, isConnectedToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import User from "@/models/User"

export async function GET() {
  try {
    // Check environment variables (don't expose actual values in production)
    const envCheck = {
      MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
      JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not set",
    }

    // Test database connection
    let dbStatus = "Not connected"
    let connectionError = null
    let userCount = 0
    let userEmails = []

    try {
      await connectToDatabase()
      dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Not connected"

      // Get user count if connected
      if (isConnectedToDatabase()) {
        userCount = await User.countDocuments()

        // Get a sample of user emails (first 5)
        const users = await User.find().select("email").limit(5)
        userEmails = users.map((user) => user.email)
      }
    } catch (error) {
      dbStatus = "Error connecting"
      connectionError = error instanceof Error ? error.message : String(error)
    }

    return NextResponse.json({
      status: "ok",
      environment: envCheck,
      database: {
        status: dbStatus,
        error: connectionError,
        connectionString: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 15)}...` : "Not set",
        userCount,
        sampleEmails: userEmails,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
