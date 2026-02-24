import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tables = await prisma.table.findMany({
        orderBy: [{ floorId: "asc" }, { name: "asc" }],
        include: {
            floor: true,
            reservations: {
                where: {
                    reservation: {
                        date: { gte: today, lt: tomorrow },
                        deletedAt: null,
                        status: { in: ["CONFIRMED", "PENDING"] },
                    },
                },
                include: {
                    reservation: {
                        include: {
                            customer: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });

    // Flatten join table so OccupancyMap gets the shape it expects
    const result = tables.map((table) => ({
        ...table,
        floorId: table.floorId,
        floorName: table.floor.name,
        reservations: table.reservations.map((rt) => ({
            id: rt.reservation.id,
            status: rt.reservation.status,
            time: rt.reservation.time,
            customer: rt.reservation.customer,
        })),
    }));

    return NextResponse.json(result);
}
