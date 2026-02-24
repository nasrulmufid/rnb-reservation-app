import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Role-based route protection middleware.
 * In production, this would verify JWT/session tokens.
 * For now, it checks a simple cookie "role" set at login.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const role = request.cookies.get("role")?.value;

    // Protect admin routes
    if (pathname.startsWith("/admin")) {
        if (role !== "ADMIN") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Protect receptionist routes
    if (pathname.startsWith("/receptionist")) {
        if (role !== "RECEPTIONIST" && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/receptionist/:path*"],
};
