"use client"

import type React from "react"

import Link from "next/link"
import { ArrowLeft, Bell, LogOut, Moon, Shield, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useFitness } from "@/context/fitness-context"
import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/context/auth-context"

export default function SettingsPage() {
  const { profile, goals, settings, updateProfile, updateGoals, updateSettings } = useFitness()
  const { logout } = useAuth()

  const [formProfile, setFormProfile] = useState({ ...profile })
  const [formGoals, setFormGoals] = useState({ ...goals })
  const [dietPurpose, setDietPurpose] = useState(profile.dietPurpose || "maintain")

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormProfile((prev) => ({
      ...prev,
      [id]: id === "height" || id === "weight" ? Number.parseFloat(value) : value,
    }))
  }

  const handleGoalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormGoals((prev) => ({
      ...prev,
      [id]: Number.parseFloat(value),
    }))
  }

  const handleSaveProfile = () => {
    updateProfile({
      ...formProfile,
      dietPurpose: dietPurpose as "lose" | "maintain" | "gain",
    })
    alert("Profile updated successfully!")
  }

  const handleSaveGoals = () => {
    updateGoals(formGoals)
    alert("Goals updated successfully!")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formProfile.name} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formProfile.email} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" type="number" value={formProfile.height} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formProfile.weight}
                    step="0.1"
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Date of Birth</Label>
                  <Input id="birthdate" type="date" value={formProfile.birthdate} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label>Diet Purpose</Label>
                  <RadioGroup value={dietPurpose} onValueChange={setDietPurpose} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lose" id="lose" />
                      <Label htmlFor="lose">Lose Weight</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maintain" id="maintain" />
                      <Label htmlFor="maintain">Maintain Weight</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gain" id="gain" />
                      <Label htmlFor="gain">Gain Weight</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
                <CardDescription>Set your health and fitness goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="steps">Daily Steps Goal</Label>
                  <Input id="steps" type="number" value={formGoals.steps} onChange={handleGoalsChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories">Daily Calorie Goal</Label>
                  <Input id="calories" type="number" value={formGoals.calories} onChange={handleGoalsChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Daily Water Goal (L)</Label>
                  <Input id="water" type="number" value={formGoals.water} step="0.1" onChange={handleGoalsChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep">Daily Sleep Goal (hours)</Label>
                  <Input id="sleep" type="number" value={formGoals.sleep} step="0.5" onChange={handleGoalsChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight-goal">Weight Goal (kg)</Label>
                  <Input
                    id="weight-goal"
                    type="number"
                    value={formGoals.weight}
                    step="0.1"
                    onChange={(e) => setFormGoals((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) }))}
                  />
                </div>
                <Button onClick={handleSaveGoals}>Save Goals</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>Customize your app experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Dark Mode</div>
                      <div className="text-sm text-muted-foreground">Enable dark theme</div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Notifications</div>
                      <div className="text-sm text-muted-foreground">Enable push notifications</div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Health Data Sync</div>
                      <div className="text-sm text-muted-foreground">Sync with Google Fit/Apple Health</div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.healthSync}
                    onCheckedChange={(checked) => updateSettings({ healthSync: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Privacy</div>
                      <div className="text-sm text-muted-foreground">Manage data and privacy settings</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <BottomNav />
      </main>
    </div>
  )
}
