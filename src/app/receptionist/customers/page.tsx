import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AddGuestForm from "@/components/features/receptionist/AddGuestForm";
import CustomerListClient from "./CustomerListClient";

export default async function CustomerListPage() {
    const customersData = await prisma.customer.findMany({
        include: {
            _count: {
                select: { reservations: { where: { status: "COMPLETED", deletedAt: null } } }
            }
        }
    });

    const customers = customersData
        .map(c => ({
            ...c,
            visitCount: c._count.reservations
        }))
        .sort((a, b) => b.visitCount - a.visitCount);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                <h1 className="text-xl font-bold">Customer List</h1>
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                        Total: {customers.length}
                    </div>
                    <AddGuestForm />
                </div>
            </div>

            <CustomerListClient customers={customers} />
        </div>
    );
}
