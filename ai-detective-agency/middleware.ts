// ============================================================
// middleware.ts — Next.js Edge Middleware
// Protects /dashboard and any sub-routes from unauthenticated access.
// Redirects to /login, preserving the original URL as ?callbackUrl=...
// ============================================================

export { default } from "next-auth/middleware";

export const config = {
  /*
   * Match all routes that start with /dashboard.
   * Add more protected prefixes here as needed, e.g.:
   *   matcher: ["/dashboard/:path*", "/admin/:path*", "/cases/:path*"]
   */
  matcher: ["/dashboard/:path*"],
};
