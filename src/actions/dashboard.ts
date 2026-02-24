"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "./auth";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

export async function getWeeklyStats() {
    try {
        await getCurrentUserId();

        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

        const reservations = await prisma.reservation.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
                status: {
                    in: ["CONFIRMED", "COMPLETED"],
                },
                deletedAt: null,
            },
        });

        // Initialize all days with 0
        const days = eachDayOfInterval({ start, end });
        const stats = days.map((day) => {
            const dayName = format(day, "EEE"); // Mon, Tue, etc.
            const count = reservations.filter((r) =>
                format(new Date(r.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
            ).length;

            return { name: dayName, total: count };
        });

        return { success: true, data: stats };

    } catch (error) {
        console.error("Failed to fetch weekly stats:", error);
        return { success: false, error: "Failed to fetch dashboard data" };
    }
}
