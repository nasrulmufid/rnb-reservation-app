"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createCustomer(data: { name: string; phone: string }) {
    try {
        // Check if phone already exists
        const existing = await prisma.customer.findUnique({
            where: { phone: data.phone },
        });

        if (existing) {
            return { success: false, error: "Phone number already registered" };
        }

        const customer = await prisma.customer.create({
            data: {
                name: data.name,
                phone: data.phone,
                visitCount: 0,
            },
        });

        // Try to log the action (non-blocking)
        try {
            const cookieStore = await cookies();
            const userId = cookieStore.get("userId")?.value;
            if (userId) {
                await prisma.systemLog.create({
                    data: {
                        action: "CREATED_CUSTOMER",
                        details: `Added new guest: ${data.name} (${data.phone})`,
                        userId,
                    },
                });
            }
        } catch {
            // Logging failure should not block customer creation
        }

        revalidatePath("/receptionist/customers");
        revalidatePath("/admin/customers");

        return { success: true, data: customer };
    } catch (error) {
        console.error("Failed to create customer:", error);
        return { success: false, error: "Failed to add guest" };
    }
}
