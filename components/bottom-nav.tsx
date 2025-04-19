"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Home, Utensils, Weight, User } from "lucide-react"

import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  // Hide navigation on onboarding page
  if (pathname === "/onboarding") {
    return null
  }

  return (
    <div className="sticky bottom-0 border-t bg-background md:hidden">
      <div className="container flex items-center justify-between p-2">
        <Link href="/" className="flex flex-col items-center p-2">
          <Home className={cn("h-5 w-5", pathname === "/" ? "text-[#27AE60]" : "")} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/steps" className="flex flex-col items-center p-2">
          <Activity className={cn("h-5 w-5", pathname === "/steps" ? "text-[#27AE60]" : "")} />
          <span className="text-xs mt-1">Steps</span>
        </Link>
        <Link href="/diet" className="flex flex-col items-center p-2">
          <Utensils className={cn("h-5 w-5", pathname === "/diet" ? "text-[#27AE60]" : "")} />
          <span className="text-xs mt-1">Diet</span>
        </Link>
        <Link href="/weight" className="flex flex-col items-center p-2">
          <Weight className={cn("h-5 w-5", pathname === "/weight" ? "text-[#27AE60]" : "")} />
          <span className="text-xs mt-1">Weight</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center p-2">
          <User className={cn("h-5 w-5", pathname === "/profile" ? "text-[#27AE60]" : "")} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  )
}
