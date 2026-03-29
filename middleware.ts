import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Define which routes are PROTECTED (anyone NOT logged in gets kicked out)
const isProtectedRoute = createRouteMatcher(['/', '/dashboard(.*)', '/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // 2. If the user is hitting a protected route, protect it!
  if (isProtectedRoute(req)) {
    // NOTICE: No parentheses after auth. Just auth.protect()
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // This protects everything except static files (images, css, etc.)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};