import mongoose, { Schema, type Document } from "mongoose"

export interface IFitnessData extends Document {
  userId: mongoose.Types.ObjectId
  steps: any[]
  waterEntries: any[]
  meals: any[]
  weightEntries: any[]
  workouts: any[]
  profile: {
    name: string
    email: string
    mobileNumber?: string
    height: number
    weight: number
    birthdate: string
    dietPurpose?: "lose" | "maintain" | "gain"
  }
  goals: {
    steps: number
    calories: number
    water: number
    sleep: number
    weight: number
  }
  settings: {
    darkMode: boolean
    notifications: boolean
    healthSync: boolean
  }
}

const FitnessDataSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  steps: { type: Array, default: [] },
  waterEntries: { type: Array, default: [] },
  meals: { type: Array, default: [] },
  weightEntries: { type: Array, default: [] },
  workouts: { type: Array, default: [] },
  profile: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String },
    height: { type: Number, default: 175 },
    weight: { type: Number, default: 70 },
    birthdate: { type: String, default: "" },
    dietPurpose: { type: String, enum: ["lose", "maintain", "gain"], default: "maintain" },
  },
  goals: {
    steps: { type: Number, default: 10000 },
    calories: { type: Number, default: 2000 },
    water: { type: Number, default: 2.5 },
    sleep: { type: Number, default: 8 },
    weight: { type: Number, default: 70 },
  },
  settings: {
    darkMode: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    healthSync: { type: Boolean, default: false },
  },
})

// Check if model exists before creating a new one (for Next.js hot reloading)
export default mongoose.models.FitnessData || mongoose.model<IFitnessData>("FitnessData", FitnessDataSchema)
