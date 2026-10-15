import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    if (token?.mustChangePassword && !pathname.startsWith("/change-password")) {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }
    if (pathname.startsWith("/treinador") && token?.role !== "TRAINER") {
      return NextResponse.redirect(new URL("/app", req.url));
    }
    if (pathname.startsWith("/app") && token?.role === "TRAINER") {
      return NextResponse.redirect(new URL("/treinador", req.url));
    }
    return NextResponse.next();
  },
  { pages: { signIn: "/" } }
);

export const config = {
  matcher: ["/app/:path*", "/treinador/:path*", "/change-password"],
};
