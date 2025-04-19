"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCw, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { useFitness } from "@/context/fitness-context"
import { useAccurateStepCounter } from "@/hooks/use-accurate-step-counter"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function StepTrackingWidget() {
  const { todaySteps, goals, addSteps } = useFitness()
  const [showSettings, setShowSettings] = useState(false)
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null)

  // Use our new accurate step counter
  const {
    steps: localSteps,
    isTracking,
    isAvailable,
    isCalibrating,
    sensitivity,
    startTracking,
    stopTracking,
    adjustSensitivity,
  } = useAccurateStepCounter({
    onStep: (count) => {
      // This is called when a step is detected
      console.log("Step detected:", count)
    },
    onCalibrationComplete: () => {
      toast({
        title: "Calibration Complete",
        description: "Step tracking is now optimized for your movement pattern",
      })
    },
  })

  // Calculate progress percentage
  const stepsProgress = Math.min(100, ((todaySteps + localSteps) / goals.steps) * 100)

  // Sync steps with fitness context periodically
  useEffect(() => {
    if (!isTracking || localSteps === 0) {
      if (syncInterval) {
        clearInterval(syncInterval)
        setSyncInterval(null)
      }
      return
    }

    const interval = setInterval(() => {
      if (localSteps > 0) {
        addSteps(localSteps)
        toast({
          title: "Steps Synced",
          description: `${localSteps} steps added to your daily total.`,
        })
      }
    }, 30000) // Sync every 30 seconds

    setSyncInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, localSteps, addSteps])

  // Add a cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval)
      }
      if (isTracking) {
        stopTracking()
      }
    }
  }, [isTracking, stopTracking, syncInterval])

  // Sync remaining steps when stopping tracking
  useEffect(() => {
    if (!isTracking && localSteps > 0) {
      addSteps(localSteps)
    }
  }, [isTracking, localSteps, addSteps])

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking()
    } else {
      startTracking()
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Step Tracking</span>
          <div className="flex items-center gap-2">
            {isAvailable && (
              <Button
                variant="outline"
                size="sm"
                className={`h-8 ${
                  isTracking
                    ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    : "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                }`}
                onClick={handleToggleTracking}
              >
                {isTracking ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" /> Start
                  </>
                )}
              </Button>
            )}

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Step Tracking Settings</DialogTitle>
                  <DialogDescription>Adjust the sensitivity to match your walking style</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Sensitivity</span>
                      <span className="text-sm text-muted-foreground">{sensitivity.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[sensitivity]}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      onValueChange={(value) => adjustSensitivity(value[0])}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Less Sensitive</span>
                      <span className="text-xs text-muted-foreground">More Sensitive</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Tips for accurate step tracking:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Keep your phone in your pocket or hand while walking</li>
                      <li>Walk naturally at a consistent pace during calibration</li>
                      <li>Increase sensitivity if steps aren't being counted</li>
                      <li>Decrease sensitivity if phantom steps are detected</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-end gap-1">
          <div className="text-2xl font-bold md:text-3xl">{todaySteps.toLocaleString()}</div>
          {localSteps > 0 && <div className="text-sm text-green-600 font-medium mb-1 md:text-base">+{localSteps}</div>}
        </div>
        <Progress value={stepsProgress} className="h-2 mt-2 md:h-3 md:mt-4" />
        <div className="flex justify-between mt-1 md:mt-2">
          <CardDescription className="text-xs md:text-sm">
            {Math.round(stepsProgress)}% of {goals.steps.toLocaleString()}
          </CardDescription>
          {isTracking && (
            <CardDescription className="text-xs md:text-sm flex items-center">
              {isCalibrating ? (
                <>
                  <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                  Calibrating...
                </>
              ) : (
                <>
                  <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                  Tracking...
                </>
              )}
            </CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
