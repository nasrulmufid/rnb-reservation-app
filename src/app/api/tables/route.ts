import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    const excludeReservationId = searchParams.get("excludeReservationId");

    const tables = await prisma.table.findMany({
        where: { isAvailable: true },
        orderBy: [{ floorId: "asc" }, { name: "asc" }],
        include: {
            floor: true,
            reservations: {
                where: {
                    reservation: {
                        status: "CONFIRMED", // Only CONFIRMED blocks the table
                        deletedAt: null,
                    },
                },
                include: { reservation: true },
            },
        },
    });

    if (!dateParam || !timeParam) {
        // If no date/time provided, return active tables without conflict info
        // or treat them all as available for now (or blocked? assume available)
        return NextResponse.json(tables.map((t: any) => ({
            ...t,
            floorId: t.floorId,
            floorName: t.floor.name,
            isBooked: false
        })));
    }

    // Construct target date same way as createReservation does (Local Midnight)
    const targetDate = new Date(dateParam + "T00:00:00");
    const [targetH, targetM] = timeParam.split(":").map(Number);
    const targetTimeMinutes = targetH * 60 + targetM;

    const result = tables.map((table: any) => {
        // Find conflicting reservation
        const conflict = table.reservations.find((rt: any) => {
            const r = rt.reservation;

            // Exclude specific reservation (useful for edits)
            if (excludeReservationId && r.id === excludeReservationId) return false;

            // STRICT DATE CHECK: using getTime() to handle timezone shifts correctly
            // Both creation and targetDate use explicit "T00:00:00" string construction
            const rDate = new Date(r.date);
            if (rDate.getTime() !== targetDate.getTime()) {
                return false;
            }

            const [rH, rM] = r.time.split(":").map(Number);
            const rTimeMinutes = rH * 60 + rM;

            // Check time window (3 hours = 180 minutes)
            return Math.abs(rTimeMinutes - targetTimeMinutes) < 180;
        });

        return {
            id: table.id,
            name: table.name,
            capacity: table.capacity,
            floorId: table.floorId,
            floorName: table.floor.name,
            isBooked: !!conflict,
            conflictReason: conflict ? `Booked at ${conflict.reservation.time}` : null,
        };
    });

    return NextResponse.json(result);
}
