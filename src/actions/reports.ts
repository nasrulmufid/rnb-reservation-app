"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "./auth";

export async function getReservationReport(startDate: string, endDate: string) {
    try {
        await getCurrentUserId(); // Ensure authenticated

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const reservations = await prisma.reservation.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            include: {
                customer: true,
                createdBy: { select: { username: true } },
                tables: {
                    include: {
                        table: { select: { name: true } },
                    },
                },
            },
            orderBy: { date: "desc" },
        });

        return { success: true, data: reservations };
    } catch (error) {
        console.error("Failed to fetch reservation report:", error);
        return { success: false, error: "Failed to fetch report data" };
    }
}
