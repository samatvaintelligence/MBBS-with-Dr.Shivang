import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isLoginPage = nextUrl.pathname === "/admin/login";
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // Redirect unauthenticated users to login
  if (isAdminRoute && !isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", nextUrl));
  }

  // Redirect authenticated users away from login page
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
