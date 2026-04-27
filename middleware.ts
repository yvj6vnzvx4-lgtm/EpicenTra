import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const DEMO_ORG_SLUG = "acme-brand-co";
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isDemo = token?.organizationSlug === DEMO_ORG_SLUG;
    const isMutation = MUTATION_METHODS.has(req.method);
    const isApi = req.nextUrl.pathname.startsWith("/api/");

    if (isDemo && isMutation && isApi) {
      return NextResponse.json(
        { error: "Demo accounts are read-only. Create your own account to make changes." },
        { status: 403 }
      );
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/strategy/:path*",
    "/api/((?!auth).)*",
  ],
};
