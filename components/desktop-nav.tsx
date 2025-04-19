"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Dumbbell, Home, Settings, Utensils, Weight, User, Droplets } from "lucide-react"

import { cn } from "@/lib/utils"

export function DesktopNav() {
  const pathname = usePathname()

  // Hide navigation on onboarding page
  if (pathname === "/onboarding") {
    return null
  }

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/steps", icon: Activity, label: "Steps" },
    { href: "/water", icon: Droplets, label: "Water" },
    { href: "/diet", icon: Utensils, label: "Diet" },
    { href: "/weight", icon: Weight, label: "Weight" },
    { href: "/workout", icon: Dumbbell, label: "Workout" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="hidden md:block fixed left-0 top-0 h-full w-64 border-r bg-background">
      <div className="p-6">
        <h2 className="text-xl font-bold text-primary mb-6">Fitness Tracker</h2>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
