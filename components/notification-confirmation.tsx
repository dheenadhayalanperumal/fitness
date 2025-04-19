"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface NotificationConfirmationProps {
  onClose: () => void
}

export function NotificationConfirmation({ onClose }: NotificationConfirmationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setVisible(false)
    // Call onClose after animation completes
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <Card className="w-full max-w-md mx-4 animate-in slide-in-from-bottom-10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <Bell className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Notifications Enabled</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            You'll now receive notifications for your fitness goals, water reminders, and activity updates.
          </p>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Got it</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
