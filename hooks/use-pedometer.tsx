"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface PedometerOptions {
  threshold?: number
  timeThreshold?: number
  onStep?: (count: number) => void
}

export function usePedometer({ threshold = 1.0, timeThreshold = 250, onStep }: PedometerOptions = {}) {
  const [steps, setSteps] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  // References for step detection algorithm
  const lastStepTime = useRef(0)
  const accelerationValues = useRef<number[]>([])
  const windowSize = 10 // Size of the sliding window for peak detection

  // Check if device motion is available
  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      setIsAvailable(true)
    }
  }, [])

  // Step detection algorithm with peak detection
  const detectStep = useCallback(
    (event: DeviceMotionEvent) => {
      if (!event.acceleration || !event.acceleration.x || !event.acceleration.y || !event.acceleration.z) {
        return
      }

      const { x, y, z } = event.acceleration
      const magnitude = Math.sqrt(x * x + y * y + z * z)

      // Add to sliding window
      accelerationValues.current.push(magnitude)
      if (accelerationValues.current.length > windowSize) {
        accelerationValues.current.shift()
      }

      // Need enough values to detect a peak
      if (accelerationValues.current.length < windowSize) {
        return
      }

      // Check if the middle value is a peak
      const middleIndex = Math.floor(windowSize / 2)
      const middleValue = accelerationValues.current[middleIndex]

      let isPeak = true
      for (let i = 0; i < windowSize; i++) {
        if (i !== middleIndex && accelerationValues.current[i] > middleValue) {
          isPeak = false
          break
        }
      }

      // If it's a peak and exceeds threshold, count as a step
      if (isPeak && middleValue > threshold) {
        const now = Date.now()
        if (now - lastStepTime.current > timeThreshold) {
          setSteps((prevSteps) => {
            const newCount = prevSteps + 1
            if (onStep) onStep(newCount)
            return newCount
          })
          lastStepTime.current = now
        }
      }
    },
    [threshold, timeThreshold, onStep],
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
    accelerationValues.current = []
  }, [])

  // Clean up
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
