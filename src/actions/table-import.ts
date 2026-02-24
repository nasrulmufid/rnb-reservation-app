"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function importTablesFromCSV(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
        return { success: false, error: "No file uploaded" };
    }

    try {
        const text = await file.text();
        const lines = text.split("\n");
        const headers = lines[0].toLowerCase().split(",").map(h => h.trim());

        const nameIndex = headers.indexOf("name");
        const capacityIndex = headers.indexOf("capacity");
        const floorIndex = headers.indexOf("floor");

        if (nameIndex === -1 || capacityIndex === -1 || floorIndex === -1) {
            return { success: false, error: "Invalid CSV format. Missing required columns: name, capacity, floor" };
        }

        const tablesToUpsert = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(",").map(v => v.trim());
            const name = values[nameIndex];
            const capacity = parseInt(values[capacityIndex]);
            const floor = parseInt(values[floorIndex]);

            if (!name || isNaN(capacity) || isNaN(floor)) continue;

            tablesToUpsert.push({ name, capacity, floor });
        }

        if (tablesToUpsert.length === 0) {
            return { success: false, error: "No valid data found in CSV" };
        }

        // Use transaction for atomic updates
        await prisma.$transaction(
            tablesToUpsert.map(table =>
                prisma.table.upsert({
                    where: { name: table.name },
                    update: { capacity: table.capacity, floorId: table.floor },
                    create: { name: table.name, capacity: table.capacity, floorId: table.floor },
                })
            )
        );

        revalidatePath("/admin/tables");
        return { success: true, count: tablesToUpsert.length };

    } catch (error) {
        console.error("CSV Import Error:", error);
        return { success: false, error: "Failed to process CSV file" };
    }
}
