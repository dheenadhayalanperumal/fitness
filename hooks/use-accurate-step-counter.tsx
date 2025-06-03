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

// Constants for step detection
const WINDOW_SIZE = 10
const MIN_STEP_FREQUENCY = 250 // Minimum time between steps (ms)
const MAX_STEP_FREQUENCY = 2000 // Maximum time between steps (ms)
const CALIBRATION_SAMPLES = 100

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

  // Advanced tracking state
  const lastStepTime = useRef(0)
  const calibrationData = useRef<number[]>([])
  const movingAverage = useRef<number[]>([])
  const peakThreshold = useRef(sensitivity)
  const valleyThreshold = useRef(0.2)
  const inStep = useRef(false)
  const lastValues = useRef<number[]>([])
  const calibrationTimer = useRef<NodeJS.Timeout | null>(null)
  
  // New refs for improved detection
  const stepPattern = useRef<number[]>([])
  const noiseFloor = useRef(0.1)
  const adaptiveThreshold = useRef(sensitivity)
  const lastPeaks = useRef<number[]>([])

  // Check device motion availability
  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      setIsAvailable(true)
    } else {
      console.warn("Device motion API is not available on this device")
    }
  }, [])

  // Improved calibration function
  const calibrate = useCallback(() => {
    setIsCalibrating(true)
    calibrationData.current = []
    
    const finishCalibration = () => {
      if (calibrationData.current.length >= CALIBRATION_SAMPLES) {
        // Calculate noise floor
        const sorted = [...calibrationData.current].sort((a, b) => a - b)
        noiseFloor.current = sorted[Math.floor(sorted.length * 0.1)] // 10th percentile

        // Calculate adaptive threshold
        const mean = calibrationData.current.reduce((a, b) => a + b, 0) / calibrationData.current.length
        const std = Math.sqrt(
          calibrationData.current.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / calibrationData.current.length
        )
        
        adaptiveThreshold.current = mean + std * 1.5
        peakThreshold.current = Math.max(sensitivity, adaptiveThreshold.current)
        valleyThreshold.current = noiseFloor.current * 2

        setIsCalibrating(false)
        if (onCalibrationComplete) onCalibrationComplete()
      }
    }

    calibrationTimer.current = setTimeout(finishCalibration, calibrationTime)

    return () => {
      if (calibrationTimer.current) {
        clearTimeout(calibrationTimer.current)
      }
    }
  }, [calibrationTime, onCalibrationComplete, sensitivity])

  // Improved motion filtering
  const filterMotion = useCallback((magnitude: number): number => {
    // Add to moving average
    movingAverage.current.push(magnitude)
    if (movingAverage.current.length > WINDOW_SIZE) {
      movingAverage.current.shift()
    }

    // Calculate filtered value
    const filtered = movingAverage.current.reduce((a, b) => a + b, 0) / movingAverage.current.length

    // Add to sliding window
    lastValues.current.push(filtered)
    if (lastValues.current.length > WINDOW_SIZE) {
      lastValues.current.shift()
    }

    return filtered
  }, [])

  // Improved step validation
  const validateStep = useCallback((timestamp: number): boolean => {
    const timeSinceLastStep = timestamp - lastStepTime.current

    // Check step frequency
    if (timeSinceLastStep < MIN_STEP_FREQUENCY || timeSinceLastStep > MAX_STEP_FREQUENCY) {
      return false
    }

    // Check step pattern
    if (lastPeaks.current.length >= 3) {
      const intervals = lastPeaks.current.slice(1).map((peak, i) => peak - lastPeaks.current[i])
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const deviation = Math.abs(timeSinceLastStep - avgInterval)
      
      if (deviation > avgInterval * 0.5) {
        return false
      }
    }

    return true
  }, [])

  // Improved step detection
  const detectStep = useCallback(
    (event: DeviceMotionEvent) => {
      if (!event.acceleration || !event.acceleration.x || !event.acceleration.y || !event.acceleration.z) {
        return
      }

      const { x, y, z } = event.acceleration
      const magnitude = Math.sqrt(x * x + y * y + z * z)

      // During calibration, just collect data
      if (isCalibrating) {
        calibrationData.current.push(magnitude)
        return
      }

      // Filter motion data
      const filtered = filterMotion(magnitude)

      // Not enough data yet
      if (lastValues.current.length < WINDOW_SIZE) {
        return
      }

      const midIndex = Math.floor(lastValues.current.length / 2)
      const midValue = lastValues.current[midIndex]

      // Step detection state machine
      if (!inStep.current) {
        // Look for peak
        let isPeak = true
        for (let i = 0; i < lastValues.current.length; i++) {
          if (i !== midIndex && lastValues.current[i] > midValue) {
            isPeak = false
            break
          }
        }

        if (isPeak && midValue > peakThreshold.current && midValue > noiseFloor.current) {
          const now = Date.now()
          
          if (validateStep(now)) {
            inStep.current = true
            lastPeaks.current.push(now)
            if (lastPeaks.current.length > 5) lastPeaks.current.shift()
          }
        }
      } else {
        // Look for valley
        let isValley = true
        for (let i = 0; i < lastValues.current.length; i++) {
          if (i !== midIndex && lastValues.current[i] < midValue) {
            isValley = false
            break
          }
        }

        if (isValley && midValue < valleyThreshold.current) {
          inStep.current = false
          const now = Date.now()
          
          // Update step count
          if (now - lastStepTime.current > timeThreshold) {
            setSteps((prevSteps) => {
              const newCount = prevSteps + 1
              if (onStep) onStep(newCount)
              return newCount
            })
            lastStepTime.current = now

            // Dynamically adjust thresholds based on recent motion
            const recentMax = Math.max(...lastValues.current)
            const recentMin = Math.min(...lastValues.current)
            peakThreshold.current = (peakThreshold.current * 0.8 + recentMax * 0.2)
            valleyThreshold.current = (valleyThreshold.current * 0.8 + recentMin * 0.2)
          }
        }
      }
    },
    [isCalibrating, timeThreshold, onStep, filterMotion, validateStep],
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
