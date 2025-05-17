import { NextResponse, NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/api/webhook"];

// Simple middleware function
export default function middleware(request: NextRequest) {
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route + '/')
  );

  // If the route is public, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get authentication status from Clerk's cookie
  const hasSession = request.cookies.has('__session');
  
  // If not authenticated, redirect to login
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // User is authenticated, allow access to protected route
  return NextResponse.next();
}

// Keep your matcher configuration
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
