"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CreateReservationData = {
    name: string;
    phone: string;
    date: string;
    time: string;
    pax: number;
    tableIds?: string[];
    remarks?: string;
};

import { getCurrentUserId } from "./auth";

export async function createReservation(data: CreateReservationData) {
    try {
        const userId = await getCurrentUserId();

        // 1. Find or create customer
        let customer = await prisma.customer.findUnique({
            where: { phone: data.phone },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    visitCount: 1,
                    lastVisit: new Date(),
                },
            });
        } else {
            await prisma.customer.update({
                where: { id: customer.id },
                data: {
                    visitCount: { increment: 1 },
                    lastVisit: new Date(),
                },
            });
        }

        // 2. Generate reservation number
        const dateStr = data.date.replace(/-/g, "");
        const prefix = `RB-${dateStr}-`;
        const lastReservation = await prisma.reservation.findFirst({
            where: { reservationNo: { startsWith: prefix } },
            orderBy: { reservationNo: "desc" },
            select: { reservationNo: true },
        });
        let nextSeq = 1;
        if (lastReservation) {
            const lastSeq = parseInt(lastReservation.reservationNo.split("-").pop() || "0", 10);
            nextSeq = lastSeq + 1;
        }
        const reservationNo = `${prefix}${nextSeq.toString().padStart(3, "0")}`;

        // 3. Create reservation
        const reservation = await prisma.reservation.create({
            data: {
                reservationNo,
                date: new Date(data.date + "T00:00:00"),
                time: data.time,
                pax: data.pax,
                remarks: data.remarks || null,
                status: "PENDING",
                customerId: customer.id,
                createdById: userId,
            },
        });

        // 4. Link tables
        if (data.tableIds && data.tableIds.length > 0) {
            await prisma.reservationTable.createMany({
                data: data.tableIds.map((tableId) => ({
                    reservationId: reservation.id,
                    tableId,
                })),
            });
        }

        // 4. Log the action
        await prisma.systemLog.create({
            data: {
                action: "CREATED_RESERVATION",
                details: `Created reservation ${reservationNo} for ${data.name}`,
                userId,
            },
        });

        revalidatePath("/receptionist/reservations");
        revalidatePath("/receptionist/dashboard");
        revalidatePath("/receptionist/customers");
        revalidatePath("/admin/reservations");
        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/customers");

        return { success: true, data: reservation };
    } catch (error) {
        console.error("Failed to create reservation:", error);
        return { success: false, error: "Failed to create reservation" };
    }
}

export async function updateReservationStatus(
    id: string,
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
) {
    try {
        const userId = await getCurrentUserId();

        // Check current status - prevent changes on locked statuses
        const current = await prisma.reservation.findUnique({ where: { id } });
        if (!current || current.deletedAt) {
            return { success: false, error: "Reservation not found" };
        }
        if (current.status === "COMPLETED" || current.status === "CANCELLED") {
            return { success: false, error: `Cannot change status: reservation is already ${current.status.toLowerCase()}` };
        }

        const reservation = await prisma.reservation.update({
            where: { id },
            data: { status },
            include: { customer: true },
        });

        await prisma.systemLog.create({
            data: {
                action: `${status}_RESERVATION`,
                details: `${status} reservation ${reservation.reservationNo} for ${reservation.customer.name}`,
                userId,
            },
        });

        revalidatePath("/receptionist/reservations");
        revalidatePath("/admin/reservations");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update status" };
    }
}

export async function updateReservation(id: string, data: CreateReservationData) {
    try {
        const userId = await getCurrentUserId();

        // 1. Check existing reservation status
        const current = await prisma.reservation.findUnique({ where: { id } });
        if (!current) {
            return { success: false, error: "Reservation not found" };
        }
        if (current.status === "COMPLETED" || current.status === "CANCELLED") {
            return { success: false, error: `Cannot edit a ${current.status} reservation.` };
        }

        // 2. Find or create customer (handle potential phone change)
        let customer = await prisma.customer.findUnique({
            where: { phone: data.phone },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    visitCount: 1,
                    lastVisit: new Date(),
                },
            });
        } else {
            // If user typed new name, maybe update it?
            if (customer.name !== data.name) {
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { name: data.name },
                });
            }
        }

        // 3. Update reservation
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                date: new Date(data.date + "T00:00:00"),
                time: data.time,
                pax: data.pax,
                remarks: data.remarks || null,
                customerId: customer.id,
            },
        });

        // 4. Update table links
        if (data.tableIds) {
            // Remove old links
            await prisma.reservationTable.deleteMany({
                where: { reservationId: id },
            });

            // Add new links
            if (data.tableIds.length > 0) {
                await prisma.reservationTable.createMany({
                    data: data.tableIds.map((tableId) => ({
                        reservationId: id,
                        tableId,
                    })),
                });
            }
        }

        // 5. Log action
        await prisma.systemLog.create({
            data: {
                action: "UPDATED_RESERVATION",
                details: `Updated reservation ${reservation.reservationNo}`,
                userId,
            },
        });

        revalidatePath("/receptionist/reservations");
        revalidatePath("/receptionist/dashboard");
        revalidatePath("/receptionist/customers");
        revalidatePath("/admin/reservations");
        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/customers");

        return { success: true, data: reservation };
    } catch (error) {
        console.error("Failed to update reservation:", error);
        return { success: false, error: "Failed to update reservation" };
    }
}
