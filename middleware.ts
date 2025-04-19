import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Update the middleware to be more permissive during the signup/onboarding flow

export function middleware(request: NextRequest) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname

  // Get the token from cookies
  const token = request.cookies.get("auth_token")?.value

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"]

  // Check if the user is authenticated
  const isAuthenticated = !!token

  // Check if the user is trying to access a public path
  const isPublicPath = publicPaths.some((pp) => path === pp || path.startsWith(`${pp}/`) || path.startsWith(`${pp}?`))

  // Check if the user has completed onboarding
  const hasCompletedOnboarding = request.cookies.get("onboarding_completed")?.value === "true"

  // If the user is not authenticated and trying to access a protected route
  if (!isAuthenticated && !isPublicPath && path !== "/onboarding") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the user is authenticated but hasn't completed onboarding
  // and is trying to access any page other than onboarding
  if (isAuthenticated && !hasCompletedOnboarding && path !== "/onboarding" && !isPublicPath) {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  // If the user is authenticated and trying to access login/signup pages
  if (isAuthenticated && isPublicPath) {
    // If they haven't completed onboarding, send them there
    if (!hasCompletedOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
    // Otherwise send them to the dashboard
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If the user is authenticated, has completed onboarding, and trying to access onboarding
  if (isAuthenticated && hasCompletedOnboarding && path === "/onboarding") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
