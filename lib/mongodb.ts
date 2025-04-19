import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

// Global variable to track connection status
let isConnected = false
let connectionPromise: Promise<typeof mongoose> | null = null

export async function connectToDatabase() {
  // If already connected, return early
  if (isConnected) {
    return mongoose
  }

  // If connection is in progress, return the existing promise
  if (connectionPromise) {
    return connectionPromise
  }

  // Check if MONGODB_URI is set
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables")
  }

  // Create a new connection promise
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("Connecting to MongoDB...")

      // Set strict query mode
      mongoose.set("strictQuery", true)

      // Add connection options for better reliability
      const db = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // Timeout after 10s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        retryWrites: true,
        w: "majority",
        maxPoolSize: 10, // Maintain up to 10 socket connections
      })

      isConnected = !!db.connections[0].readyState
      console.log("MongoDB connected successfully")

      // Set up connection event listeners
      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err)
        isConnected = false
      })

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected")
        isConnected = false
        connectionPromise = null
      })

      resolve(db)
    } catch (error) {
      console.error("MongoDB connection error:", error)

      // Try to disconnect if connection failed
      try {
        await mongoose.disconnect()
      } catch (disconnectError) {
        console.error("Error during disconnect after failed connection:", disconnectError)
      }

      isConnected = false
      connectionPromise = null
      reject(error)
    }
  })

  return connectionPromise
}

export function disconnectFromDatabase() {
  if (!isConnected) {
    return Promise.resolve()
  }

  return mongoose
    .disconnect()
    .then(() => {
      isConnected = false
      connectionPromise = null
      console.log("MongoDB disconnected")
    })
    .catch((error) => {
      console.error("Error disconnecting from MongoDB:", error)
      throw error
    })
}

// Check connection status
export function isConnectedToDatabase() {
  return isConnected && mongoose.connection.readyState === 1
}
