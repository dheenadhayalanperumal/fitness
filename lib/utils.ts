import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date)
}

export function calculateBMI(weight: number, height: number): number {
  // Weight in kg, height in cm
  const heightInMeters = height / 100
  return Number.parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

export function calculateCaloriesBurned(steps: number): number {
  // Simple estimation: 1 step burns approximately 0.04 calories
  return Math.round(steps * 0.04)
}

export function calculateDistanceFromSteps(steps: number): number {
  // Simple estimation: 1 step is approximately 0.762 meters (30 inches)
  const distanceInMeters = steps * 0.762
  return Number.parseFloat((distanceInMeters / 1000).toFixed(1)) // Convert to km
}

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0]
}

export function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) {
    return Math.floor(interval) + " years ago"
  }

  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + " months ago"
  }

  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + " days ago"
  }

  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + " hours ago"
  }

  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago"
  }

  return Math.floor(seconds) + " seconds ago"
}

export function getDayName(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)
}
