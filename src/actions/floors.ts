"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFloors() {
    try {
        const floors = await prisma.floor.findMany({
            orderBy: { id: "asc" },
            include: {
                _count: {
                    select: { tables: true }
                }
            }
        });
        return { success: true, data: floors };
    } catch (error) {
        console.error("Failed to fetch floors:", error);
        return { success: false, error: "Failed to fetch floors" };
    }
}

export async function createFloor(data: { name: string }) {
    try {
        const floor = await prisma.floor.create({
            data: {
                name: data.name,
            },
        });
        revalidatePath("/admin/tables");
        return { success: true, data: floor };
    } catch (error) {
        console.error("Failed to create floor:", error);
        return { success: false, error: "Failed to create floor" };
    }
}

export async function updateFloor(id: number, data: { name: string }) {
    try {
        const floor = await prisma.floor.update({
            where: { id },
            data: {
                name: data.name,
            },
        });
        revalidatePath("/admin/tables");
        return { success: true, data: floor };
    } catch (error) {
        console.error("Failed to update floor:", error);
        return { success: false, error: "Failed to update floor" };
    }
}

export async function deleteFloor(id: number) {
    try {
        // Check if floor has tables
        const floor = await prisma.floor.findUnique({
            where: { id },
            include: { _count: { select: { tables: true } } }
        });

        if (!floor) return { success: false, error: "Floor not found" };

        if (floor._count.tables > 0) {
            return { success: false, error: "Cannot delete floor with existing tables. Please move or delete tables first." };
        }

        await prisma.floor.delete({
            where: { id },
        });

        revalidatePath("/admin/tables");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete floor:", error);
        return { success: false, error: "Failed to delete floor" };
    }
}
