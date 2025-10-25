import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  /**
   * Bypass middleware for the Socket.IO API route to avoid interfering
   * with WebSocket upgrade requests which can be blocked by auth logic.
   * The Socket.IO server is initialized in `pages/api/socket/io.ts` and
   * upgrade requests must be allowed to proceed without running the
   * Clerk auth middleware.
   */
  if (req.nextUrl && typeof req.nextUrl.pathname === "string") {
    if (req.nextUrl.pathname.startsWith("/api/socket")) {
      return NextResponse.next();
    }
  }

  let hostURL;
  if (process.env.NODE_ENV === "production") {
    hostURL = `${
      req.nextUrl.protocol + "//" + req.nextUrl.hostname + req.nextUrl.pathname
    }`;
  } else {
    hostURL = req.url;
  }

  const { userId, redirectToSignIn } = await auth();

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  if (userId && !isPublicRoute(req)) {
    const user = (await clerkClient()).users.getUser(userId);
    const userData = (await user).privateMetadata;

    if (userData.role === "Admin" || userData.role === "Staff") {
      return NextResponse.next();
    } else {
      await auth.protect();
      return redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
