import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Added '/' and '/api/generate' to the public list
const isPublicRoute = createRouteMatcher([
  '/', 
  '/contact(.*)',  
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/privacy',
  '/terms',
  '/post-types(.*)',
  '/api/generate(.*)',
  '/api/webhooks/(.*)',
  '/api/waitlist(.*)', 
  '/api/contact(.*)', 
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|__clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};