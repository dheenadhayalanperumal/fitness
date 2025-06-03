"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFitness } from "@/context/fitness-context"
import { BottomNav } from "@/components/bottom-nav"

export default function StepsPage() {
  const router = useRouter()
  const { todaySteps, goals } = useFitness()

  return (
    <div className="container pb-20">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Steps</h1>
            <p className="text-muted-foreground">This feature has been temporarily disabled</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Step Tracking Disabled</CardTitle>
          <CardDescription>
            The step tracking feature has been temporarily disabled for improvements. We apologize for any inconvenience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We are working on making the step tracking more accurate and reliable. Please check back later.
          </p>
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  )
}
