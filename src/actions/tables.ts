"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./auth";

interface CreateTableData {
    name: string;
    capacity: number;
    floorId: number;
    positionX?: number;
    positionY?: number;
}

export async function createTable(data: CreateTableData) {
    try {
        const userId = await getCurrentUserId();

        const table = await prisma.table.create({
            data: {
                name: data.name,
                capacity: data.capacity,
                floorId: data.floorId,
                positionX: data.positionX || 0,
                positionY: data.positionY || 0,
            },
        });

        await prisma.systemLog.create({
            data: {
                action: "CREATED_TABLE",
                details: `Created table ${table.name} (Floor ${table.floorId}, Cap ${table.capacity})`,
                userId,
            },
        });

        revalidatePath("/admin/tables");
        revalidatePath("/receptionist/map");
        return { success: true, data: table };
    } catch (error) {
        console.error("Failed to create table:", error);
        return { success: false, error: "Failed to create table" };
    }
}

export async function updateTable(id: string, data: Partial<CreateTableData>) {
    try {
        const userId = await getCurrentUserId();

        const table = await prisma.table.update({
            where: { id },
            data,
        });

        await prisma.systemLog.create({
            data: {
                action: "UPDATED_TABLE",
                details: `Updated table ${table.name}`,
                userId,
            },
        });

        revalidatePath("/admin/tables");
        revalidatePath("/receptionist/map");
        return { success: true, data: table };
    } catch (error) {
        console.error("Failed to update table:", error);
        return { success: false, error: "Failed to update table" };
    }
}

export async function deleteTable(id: string) {
    try {
        const userId = await getCurrentUserId();
        const table = await prisma.table.findUnique({ where: { id } });

        if (!table) return { success: false, error: "Table not found" };

        await prisma.table.delete({ where: { id } });

        await prisma.systemLog.create({
            data: {
                action: "DELETED_TABLE",
                details: `Deleted table ${table.name}`,
                userId,
            },
        });

        revalidatePath("/admin/tables");
        revalidatePath("/receptionist/map");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete table:", error);
        return { success: false, error: "Failed to delete table. Check if there are existing reservations." };
    }
}
