import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()

  // Get all cookies related to authentication
  const authToken = cookieStore.get("auth_token")
  const authUser = cookieStore.get("auth_user")
  const onboardingCompleted = cookieStore.get("onboarding_completed")

  // Parse user data if available
  let userData = null
  try {
    if (authUser?.value) {
      userData = JSON.parse(authUser.value)
    }
  } catch (error) {
    console.error("Error parsing user data:", error)
  }

  return NextResponse.json({
    authStatus: {
      isAuthenticated: !!authToken,
      hasCompletedOnboarding: onboardingCompleted?.value === "true",
      tokenExists: !!authToken,
      userDataExists: !!authUser,
    },
    cookies: {
      authToken: authToken ? { name: authToken.name, value: "***" } : null,
      authUser: authUser ? { name: authUser.name } : null,
      onboardingCompleted: onboardingCompleted
        ? { name: onboardingCompleted.name, value: onboardingCompleted.value }
        : null,
    },
    userData: userData
      ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          hasCompletedOnboarding: userData.hasCompletedOnboarding,
        }
      : null,
    timestamp: new Date().toISOString(),
  })
}
