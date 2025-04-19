"use client"

import { useState, useEffect, useCallback } from "react"

interface StepCounterOptions {
  sensitivity?: number
  debounceTime?: number
  onStep?: (count: number) => void
}

export function useStepCounter({ sensitivity = 1.2, debounceTime = 300, onStep }: StepCounterOptions = {}) {
  const [steps, setSteps] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  // Initialize step detection
  useEffect(() => {
    // Check if DeviceMotionEvent is available
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      setIsAvailable(true)
    } else {
      console.warn("Device motion API is not available on this device")
    }
  }, [])

  // Step detection algorithm
  const detectStep = useCallback(
    (event: DeviceMotionEvent) => {
      if (!event.acceleration || !event.acceleration.x || !event.acceleration.y || !event.acceleration.z) {
        return
      }

      const { x, y, z } = event.acceleration
      const magnitude = Math.sqrt(x * x + y * y + z * z)

      // Detect a step when acceleration magnitude exceeds the threshold
      if (magnitude > sensitivity) {
        // Debounce to avoid counting multiple steps for a single step
        detectStep.lastStepTime = detectStep.lastStepTime || 0
        const now = Date.now()

        if (now - detectStep.lastStepTime > debounceTime) {
          setSteps((prevSteps) => {
            const newCount = prevSteps + 1
            if (onStep) onStep(newCount)
            return newCount
          })
          detectStep.lastStepTime = now
        }
      }
    },
    [sensitivity, debounceTime, onStep],
  )

  // Start tracking steps
  const startTracking = useCallback(() => {
    if (!isAvailable) return false

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      // iOS 13+ requires permission
      DeviceMotionEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            window.addEventListener("devicemotion", detectStep)
            setIsTracking(true)
          } else {
            console.error("Permission to access motion sensors was denied")
          }
        })
        .catch(console.error)
    } else {
      // Other browsers
      window.addEventListener("devicemotion", detectStep)
      setIsTracking(true)
    }

    return true
  }, [isAvailable, detectStep])

  // Stop tracking steps
  const stopTracking = useCallback(() => {
    window.removeEventListener("devicemotion", detectStep)
    setIsTracking(false)
  }, [detectStep])

  // Reset step counter
  const resetSteps = useCallback(() => {
    setSteps(0)
  }, [])

  // Clean up event listeners
  useEffect(() => {
    return () => {
      if (isTracking) {
        window.removeEventListener("devicemotion", detectStep)
      }
    }
  }, [isTracking, detectStep])

  return {
    steps,
    isTracking,
    isAvailable,
    startTracking,
    stopTracking,
    resetSteps,
  }
}
