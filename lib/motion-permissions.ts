/**
 * Checks if the device supports motion sensors
 */
export async function isMotionSensorAvailable(): Promise<boolean> {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.DeviceMotionEvent) {
    return false
  }

  // For iOS 13+, we need to check if permission is granted
  if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
    try {
      // Try to get the permission state
      const state = await (DeviceMotionEvent as any).requestPermission()
      return state === "granted"
    } catch (e) {
      // If there's an error, we'll assume the sensor is not available
      return false
    }
  }

  // For other browsers, we'll assume the sensor is available if DeviceMotionEvent exists
  return true
}

/**
 * Requests permission to use motion sensors
 * This is required for iOS 13+ devices
 */
export async function requestMotionPermission(): Promise<boolean> {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.DeviceMotionEvent) {
    return false
  }

  // For iOS 13+, we need to request permission
  if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
    try {
      const permissionState = await (DeviceMotionEvent as any).requestPermission()
      return permissionState === "granted"
    } catch (e) {
      console.error("Error requesting motion permission:", e)
      return false
    }
  }

  // For other browsers, permission is implicitly granted
  return true
}
