"use client"

import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Droplets, Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFitness } from "@/context/fitness-context"
import { formatDate, getDateString } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"

export default function WaterPage() {
  const { getWaterEntriesForDate, getWaterTotalForDate, goals, addWater, editWaterEntry, deleteWaterEntry } =
    useFitness()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const selectedDateString = getDateString(selectedDate)

  // Get water entries and total for the selected date
  const waterEntries = getWaterEntriesForDate(selectedDateString)
  const waterTotal = getWaterTotalForDate(selectedDateString)

  const waterPercentage = Math.min((waterTotal / goals.water) * 100, 100)

  // Sort water entries by timestamp (newest first)
  const sortedEntries = [...waterEntries].sort((a, b) => b.timestamp - a.timestamp)

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 1)
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  const isToday = selectedDateString === getDateString()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">Water Intake</h1>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Previous</span>
              </Button>
              <span className="font-medium">{formatDate(selectedDate)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDay}
                disabled={new Date(selectedDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)}
              >
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Water Intake</CardTitle>
              <CardDescription>
                Your water consumption for {isToday ? "today" : formatDate(selectedDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative h-64 w-48">
                  <div className="absolute inset-0 rounded-3xl border-4 border-[#2980B9] overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full bg-[#2980B9]/20 transition-all duration-500"
                      style={{ height: "100%" }}
                    />
                    <div
                      className="absolute bottom-0 w-full bg-[#2980B9] transition-all duration-500"
                      style={{ height: `${waterPercentage}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-5xl font-bold text-[#2980B9]">{waterTotal.toFixed(1)}L</div>
                    <div className="text-sm text-muted-foreground">of {goals.water}L goal</div>
                    <div className="mt-2 text-lg font-medium">{Math.round(waterPercentage)}%</div>
                  </div>
                </div>
                {isToday && (
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col" onClick={() => addWater(100)}>
                      <span className="text-lg font-bold text-[#2980B9]">+100ml</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col" onClick={() => addWater(250)}>
                      <span className="text-lg font-bold text-[#2980B9]">+250ml</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col" onClick={() => addWater(500)}>
                      <span className="text-lg font-bold text-[#2980B9]">+500ml</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{isToday ? "Today's Log" : `Log for ${formatDate(selectedDate)}`}</CardTitle>
              <CardDescription>Your water intake history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between ${index < sortedEntries.length - 1 ? "border-b pb-2" : ""}`}
                  >
                    <div className="flex items-center">
                      <Droplets className="mr-2 h-5 w-5 text-[#2980B9]" />
                      <div>
                        <div className="font-medium">{entry.amount}ml</div>
                        <div className="text-xs text-muted-foreground">{entry.time}</div>
                      </div>
                    </div>
                    {isToday && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newAmount = prompt("Enter new amount (ml):", entry.amount.toString())
                            if (newAmount && !isNaN(Number.parseInt(newAmount))) {
                              editWaterEntry(entry.id, Number.parseInt(newAmount))
                            }
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this entry?")) {
                              deleteWaterEntry(entry.id)
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {sortedEntries.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No water entries for {isToday ? "today" : formatDate(selectedDate)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      {isToday && (
        <div className="fixed bottom-6 right-6">
          <Button
            size="lg"
            className="rounded-full h-14 w-14 bg-[#2980B9] hover:bg-[#2471A3]"
            onClick={() => {
              const amount = prompt("Enter water amount in ml:")
              if (amount && !isNaN(Number.parseInt(amount))) {
                addWater(Number.parseInt(amount))
              }
            }}
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Add water</span>
          </Button>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
