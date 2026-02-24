"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./auth";
import { Role } from "@prisma/client";

interface CreateUserData {
    username: string;
    password?: string;
    role: Role;
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
            }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}

export async function createUser(data: CreateUserData) {
    try {
        const currentUserId = await getCurrentUserId();

        // Check if username exists
        const existing = await prisma.user.findUnique({
            where: { username: data.username }
        });

        if (existing) {
            return { success: false, error: "Username already exists" };
        }

        const user = await prisma.user.create({
            data: {
                username: data.username,
                password: data.password || "password123", // Default password if not provided
                role: data.role,
            },
        });

        await prisma.systemLog.create({
            data: {
                action: "CREATED_USER",
                details: `Created user ${user.username} with role ${user.role}`,
                userId: currentUserId,
            },
        });

        revalidatePath("/admin/users");
        return { success: true, data: user };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Failed to create user" };
    }
}

export async function updateUser(id: string, data: Partial<CreateUserData>) {
    try {
        const currentUserId = await getCurrentUserId();

        const user = await prisma.user.update({
            where: { id },
            data,
        });

        await prisma.systemLog.create({
            data: {
                action: "UPDATED_USER",
                details: `Updated user ${user.username}`,
                userId: currentUserId,
            },
        });

        revalidatePath("/admin/users");
        return { success: true, data: user };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Failed to update user" };
    }
}

export async function deleteUser(id: string) {
    try {
        const currentUserId = await getCurrentUserId();

        if (id === currentUserId) {
            return { success: false, error: "Cannot delete yourself" };
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return { success: false, error: "User not found" };

        if (user.username === "admin" || user.id === "system") {
            return { success: false, error: "Cannot delete system accounts" };
        }

        await prisma.user.delete({ where: { id } });

        await prisma.systemLog.create({
            data: {
                action: "DELETED_USER",
                details: `Deleted user ${user.username}`,
                userId: currentUserId,
            },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        // P2003 is foreign key constraint violation
        return { success: false, error: "Failed to delete user. They may have related records." };
    }
}
