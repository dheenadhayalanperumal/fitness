// Check if browser supports notifications
const isNotificationSupported = () => {
  return "Notification" in window
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.log("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  const permission = await Notification.requestPermission()
  return permission === "granted"
}

// Send notification
export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    console.log("Notifications not supported or permission not granted")
    return
  }

  return new Notification(title, options)
}

// Water reminder notification
export const sendWaterReminderNotification = () => {
  return sendNotification("Water Reminder", {
    body: "You haven't logged any water in the last hour. Stay hydrated!",
    icon: "/icons/water-icon.png",
    badge: "/icons/badge-icon.png",
    tag: "water-reminder",
  })
}

// Sedentary reminder notification
export const sendSedentaryReminderNotification = () => {
  return sendNotification("Movement Reminder", {
    body: "You've been sitting for over an hour. Time to move around!",
    icon: "/icons/activity-icon.png",
    badge: "/icons/badge-icon.png",
    tag: "sedentary-reminder",
  })
}

// Calorie intake notification
export const sendCalorieIntakeNotification = (type: "low" | "high") => {
  const title = type === "low" ? "Low Calorie Intake" : "High Calorie Intake"
  const body =
    type === "low"
      ? "Your calorie intake is below your daily goal. Consider eating something nutritious."
      : "Your calorie intake is above your daily goal. Consider moderating your intake."

  return sendNotification(title, {
    body,
    icon: "/icons/food-icon.png",
    badge: "/icons/badge-icon.png",
    tag: "calorie-reminder",
  })
}
