import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FitnessProvider } from "@/context/fitness-context"
import { AuthProvider } from "@/context/auth-context"
import { DesktopNav } from "@/components/desktop-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fitness Tracker",
  description: "Track your fitness goals and progress",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <FitnessProvider>
            <div className="flex">
              <DesktopNav />
              <div className="flex-1 md:ml-64">{children}</div>
            </div>
          </FitnessProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
