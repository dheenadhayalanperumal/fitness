// This is a mock implementation for demonstration purposes
// In a real app, you would use a real database like Supabase, Firebase, MongoDB, etc.

// Define types for our database models
export type DbUser = {
  id: string
  email: string
  name: string
  password: string // In a real app, this would be hashed
  createdAt: number
}

export type DbFitnessData = {
  userId: string
  steps: any[]
  waterEntries: any[]
  meals: any[]
  weightEntries: any[]
  workouts: any[]
  profile: any
  goals: any
  settings: any
}

// Mock database
class MockDatabase {
  private users: Map<string, DbUser> = new Map()
  private fitnessData: Map<string, DbFitnessData> = new Map()

  // User methods
  async createUser(email: string, name: string, password: string): Promise<DbUser> {
    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find((user) => user.email === email)
    if (existingUser) {
      throw new Error("User already exists")
    }

    // Create new user
    const id = Math.random().toString(36).substring(2, 15)
    const user: DbUser = {
      id,
      email,
      name,
      password, // In a real app, this would be hashed
      createdAt: Date.now(),
    }

    // Save user
    this.users.set(id, user)

    // Create empty fitness data for user
    this.fitnessData.set(id, {
      userId: id,
      steps: [],
      waterEntries: [],
      meals: [],
      weightEntries: [],
      workouts: [],
      profile: {
        name,
        email,
        height: 175,
        weight: 70,
        birthdate: "",
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

    return user
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const user = Array.from(this.users.values()).find((user) => user.email === email)
    return user || null
  }

  async getUserById(id: string): Promise<DbUser | null> {
    return this.users.get(id) || null
  }

  // Fitness data methods
  async getFitnessData(userId: string): Promise<DbFitnessData | null> {
    return this.fitnessData.get(userId) || null
  }

  async updateFitnessData(userId: string, data: Partial<DbFitnessData>): Promise<DbFitnessData> {
    const existingData = this.fitnessData.get(userId)
    if (!existingData) {
      throw new Error("User fitness data not found")
    }

    const updatedData = { ...existingData, ...data }
    this.fitnessData.set(userId, updatedData)
    return updatedData
  }
}

// Create and export database instance
export const db = new MockDatabase()

// Initialize with a demo user
db.createUser("user@example.com", "Demo User", "password").catch(console.error)
