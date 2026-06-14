// Protects the member dashboard: unauthenticated visitors are redirected
// to the /login page (configured in lib/auth.ts).
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*"],
};
