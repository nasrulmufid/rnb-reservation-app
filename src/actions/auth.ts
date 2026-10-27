"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function login(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    // Look up user in DB
    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user || user.password !== password) {
        return { error: "Invalid credentials" };
    }

    // Set role cookie for middleware
    const cookieStore = await cookies();
    
    // Determine if we should set secure flag
    // Use secure only in production AND when accessed via HTTPS
    // For Docker development on localhost:3000 (HTTP), we need secure: false
    const isSecure = process.env.NODE_ENV === "production" && 
                    (process.env.SECURE_COOKIES === "true" || 
                     process.env.NEXTAUTH_URL?.startsWith("https://"));
    
    cookieStore.set("role", user.role, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
    });
    cookieStore.set("userId", user.id, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
    });

    // Log login
    await prisma.systemLog.create({
        data: {
            action: "LOGIN",
            details: `User ${user.username} logged in`,
            userId: user.id,
        },
    });

    // Redirect based on role
    if (user.role === "ADMIN") {
        redirect("/admin/dashboard");
    } else {
        redirect("/receptionist/dashboard");
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("role");
    cookieStore.delete("userId");
    redirect("/login");
}

export async function getCurrentUserId(): Promise<string> {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (userId) {
        // Verify user exists to prevent FK errors
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (user) {
            return user.id;
        }
    }

    return "system";
}
