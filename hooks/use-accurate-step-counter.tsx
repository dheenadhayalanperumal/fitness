"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "@/hooks/use-toast"

interface AccurateStepCounterOptions {
  sensitivity?: number
  timeThreshold?: number
  calibrationTime?: number
  onStep?: (count: number) => void
  onCalibrationComplete?: () => void
}

export function useAccurateStepCounter({
  sensitivity = 1.2,
  timeThreshold = 250,
  calibrationTime = 3000,
  onStep,
  onCalibrationComplete,
}: AccurateStepCounterOptions = {}) {
  const [steps, setSteps] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [userSensitivity, setUserSensitivity] = useState(sensitivity)

  // References for tracking state
  const lastStepTime = useRef(0)
  const calibrationData = useRef<number[]>([])
  const movingAverage = useRef<number[]>([])
  const peakThreshold = useRef(sensitivity)
  const valleyThreshold = useRef(0.2)
  const inStep = useRef(false)
  const lastValues = useRef<number[]>([])
  const calibrationTimer = useRef<NodeJS.Timeout | null>(null)

  // Check if device motion is available
  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      setIsAvailable(true)
    } else {
      console.warn("Device motion API is not available on this device")
    }
  }, [])

  // Calibration function to determine user-specific thresholds
  const calibrate = useCallback(() => {
    setIsCalibrating(true)
    calibrationData.current = []

    // Set a timer to end calibration
    calibrationTimer.current = setTimeout(() => {
      if (calibrationData.current.length > 0) {
        // Calculate average and standard deviation of motion
        const sum = calibrationData.current.reduce((a, b) => a + b, 0)
        const avg = sum / calibrationData.current.length

        const variance =
          calibrationData.current.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / calibrationData.current.length
        const stdDev = Math.sqrt(variance)

        // Set thresholds based on calibration data
        peakThreshold.current = avg + stdDev * 1.5
        valleyThreshold.current = Math.max(0.1, avg - stdDev * 0.5)

        // Update user sensitivity
        setUserSensitivity(peakThreshold.current)

        console.log("Calibration complete:", {
          average: avg,
          stdDev: stdDev,
          peakThreshold: peakThreshold.current,
          valleyThreshold: valleyThreshold.current,
        })

        if (onCalibrationComplete) {
          onCalibrationComplete()
        }
      }

      setIsCalibrating(false)
    }, calibrationTime)

    return () => {
      if (calibrationTimer.current) {
        clearTimeout(calibrationTimer.current)
        calibrationTimer.current = null
      }
    }
  }, [calibrationTime, onCalibrationComplete])

  // Improve the detectStep function to be more accurate
  const detectStep = useCallback(
    (event: DeviceMotionEvent) => {
      if (!event.acceleration || !event.acceleration.x || !event.acceleration.y || !event.acceleration.z) {
        return
      }

      // Only process if we're actually tracking
      if (!isTracking) return

      const { x, y, z } = event.acceleration
      const magnitude = Math.sqrt(x * x + y * y + z * z)

      // During calibration, just collect data
      if (isCalibrating) {
        calibrationData.current.push(magnitude)
        return
      }

      // Add to moving average window (for smoothing)
      movingAverage.current.push(magnitude)
      if (movingAverage.current.length > 5) {
        movingAverage.current.shift()
      }

      // Calculate smoothed value
      const smoothedMagnitude = movingAverage.current.reduce((a, b) => a + b, 0) / movingAverage.current.length

      // Add to last values for peak detection
      lastValues.current.push(smoothedMagnitude)
      if (lastValues.current.length > 10) {
        lastValues.current.shift()
      }

      // Need enough values for step detection
      if (lastValues.current.length < 5) return

      // Get the middle value
      const midIndex = Math.floor(lastValues.current.length / 2)
      const midValue = lastValues.current[midIndex]

      // Check if we're in a step already
      if (!inStep.current) {
        // Check if the middle value is a peak (higher than neighbors and above threshold)
        let isPeak = true
        for (let i = 0; i < lastValues.current.length; i++) {
          if (i !== midIndex && lastValues.current[i] > midValue) {
            isPeak = false
            break
          }
        }

        // If it's a peak and exceeds threshold, start a step
        if (isPeak && midValue > peakThreshold.current) {
          const now = Date.now()
          // Ensure minimum time between steps to avoid double counting
          if (now - lastStepTime.current > timeThreshold) {
            inStep.current = true
            lastStepTime.current = now
          }
        }
      } else {
        // We're in a step, look for a valley to complete the step
        let isValley = true
        for (let i = 0; i < lastValues.current.length; i++) {
          if (i !== midIndex && lastValues.current[i] < midValue) {
            isValley = false
            break
          }
        }

        // If it's a valley and below threshold, complete the step
        if (isValley && midValue < valleyThreshold.current) {
          inStep.current = false
          setSteps((prevSteps) => {
            const newCount = prevSteps + 1
            if (onStep) onStep(newCount)
            return newCount
          })
        }
      }
    },
    [isTracking, isCalibrating, timeThreshold, onStep],
  )

  // Start tracking steps
  const startTracking = useCallback(() => {
    if (!isAvailable) return false

    const startMotionTracking = () => {
      // Reset state
      setSteps(0)
      movingAverage.current = []
      lastValues.current = []
      inStep.current = false

      // Start calibration
      calibrate()

      // Start listening for motion events
      window.addEventListener("devicemotion", detectStep)
      setIsTracking(true)

      toast({
        title: "Step Tracking Started",
        description: "Calibrating your movement pattern...",
      })

      return true
    }

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      // iOS 13+ requires permission
      DeviceMotionEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            startMotionTracking()
          } else {
            toast({
              title: "Permission Denied",
              description: "Step tracking requires motion sensor permission",
              variant: "destructive",
            })
          }
        })
        .catch((error) => {
          console.error("Error requesting motion permission:", error)
          toast({
            title: "Permission Error",
            description: "Could not request motion sensor permission",
            variant: "destructive",
          })
        })
    } else {
      // Other browsers
      return startMotionTracking()
    }

    return true
  }, [isAvailable, detectStep, calibrate])

  // Update the stopTracking function to ensure all tracking is properly stopped
  const stopTracking = useCallback(() => {
    // Remove event listener
    window.removeEventListener("devicemotion", detectStep)

    // Clear calibration timer if it exists
    if (calibrationTimer.current) {
      clearTimeout(calibrationTimer.current)
      calibrationTimer.current = null
    }

    // Reset tracking state variables to prevent phantom steps
    inStep.current = false
    movingAverage.current = []
    lastValues.current = []
    lastStepTime.current = 0

    // Reset states
    setIsTracking(false)
    setIsCalibrating(false)

    toast({
      title: "Step Tracking Stopped",
      description: isCalibrating ? "Calibration canceled" : `Tracked ${steps} steps`,
    })
  }, [detectStep, steps, isCalibrating])

  // Reset step counter
  const resetSteps = useCallback(() => {
    setSteps(0)
  }, [])

  // Adjust sensitivity
  const adjustSensitivity = useCallback((newSensitivity: number) => {
    setUserSensitivity(newSensitivity)
    peakThreshold.current = newSensitivity
  }, [])

  // Clean up event listeners
  useEffect(() => {
    return () => {
      if (isTracking) {
        window.removeEventListener("devicemotion", detectStep)
      }

      if (calibrationTimer.current) {
        clearTimeout(calibrationTimer.current)
        calibrationTimer.current = null
      }
    }
  }, [isTracking, detectStep])

  return {
    steps,
    isTracking,
    isAvailable,
    isCalibrating,
    sensitivity: userSensitivity,
    startTracking,
    stopTracking,
    resetSteps,
    adjustSensitivity,
  }
}
