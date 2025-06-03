import mongoose from "mongoose"

const fitnessDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profile: {
      name: { type: String, default: "John Doe" },
      email: { type: String, required: true },
      height: { type: Number },
      weight: { type: Number },
      age: { type: Number },
      gender: { type: String, enum: ["male", "female", "other"] },
    },
    goals: {
      water: { type: Number, default: 2.5 }, // in liters
      calories: { type: Number, default: 2000 },
      weight: { type: Number, default: 70 }, // in kg
    },
    waterLog: [
      {
        amount: { type: Number, required: true }, // in liters
        timestamp: { type: Date, default: Date.now },
      },
    ],
    caloriesLog: [
      {
        amount: { type: Number, required: true },
        description: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    weightLog: [
      {
        weight: { type: Number, required: true }, // in kg
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
)

// Create indexes for better query performance
fitnessDataSchema.index({ userId: 1 })
fitnessDataSchema.index({ "waterLog.timestamp": -1 })
fitnessDataSchema.index({ "caloriesLog.timestamp": -1 })
fitnessDataSchema.index({ "weightLog.timestamp": -1 })

const FitnessData = mongoose.models.FitnessData || mongoose.model("FitnessData", fitnessDataSchema)

export default FitnessData
