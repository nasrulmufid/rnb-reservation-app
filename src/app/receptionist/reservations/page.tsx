import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Clock, Users, Hash, CalendarDays, Pencil } from "lucide-react";
import Link from "next/link";
import StatusChanger from "@/components/features/StatusChanger";
import ReservationFilter from "@/components/features/ReservationFilter";

// Always render fresh data from the DB (never cache at build time)
export const dynamic = "force-dynamic";

export default async function ReservationListPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; date?: string }>;
}) {
    const params = await searchParams;
    const statusFilter = params.status?.toUpperCase();
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    const activeFilter = validStatuses.includes(statusFilter || "") ? statusFilter : undefined;
    const dateFilter = params.date || undefined; // YYYY-MM-DD

    const dateWhere = dateFilter ? {
        date: {
            gte: new Date(dateFilter + "T00:00:00"),
            lt: new Date(dateFilter + "T23:59:59"),
        },
    } : {};

    const reservations = await prisma.reservation.findMany({
        where: {
            deletedAt: null,
            ...(activeFilter ? { status: activeFilter as any } : {}),
            ...dateWhere,
        },
        include: { customer: true, tables: { include: { table: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4">
                <h1 className="text-xl font-bold">Reservations</h1>
                <Link
                    href="/receptionist/reservations/new"
                    className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                    + New
                </Link>
            </div>

            {/* Status Filter Tabs */}
            <ReservationFilter activeFilter={activeFilter} activeDate={dateFilter} />

            {/* List */}
            <div className="space-y-3 pb-20">
                {reservations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                        No {activeFilter ? activeFilter.toLowerCase() : ""} reservations found
                    </p>
                ) : (
                    reservations.map((res) => (
                        <Card key={res.id} className="border-border/60 overflow-visible">
                            <CardContent className="p-0">
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm">{res.customer.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/receptionist/reservations/${res.id}/edit`} className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Edit Reservation">
                                                <Pencil size={14} />
                                            </Link>
                                            <StatusChanger reservationId={res.id} currentStatus={res.status} compact />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Phone size={10} /> {res.customer.phone}</span>
                                        <span className="flex items-center gap-1"><Clock size={10} /> {res.time}</span>
                                        <span className="flex items-center gap-1"><Users size={10} /> {res.pax}</span>
                                    </div>
                                    {res.remarks && (
                                        <div className="text-xs  text-red-500 bg-muted/50 p-1.5 rounded text-muted-foreground italic border border-border/50">
                                            <span className="font-medium not-italic mr-1">Note:</span>{res.remarks}
                                        </div>
                                    )}
                                </div>
                                <div className="px-3 py-2 bg-muted/30 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1 font-mono">
                                        <Hash size={10} /> {res.reservationNo}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CalendarDays size={10} /> {new Date(res.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                    </span>
                                    <span>{res.tables.length > 0 ? res.tables.map((rt: any) => rt.table.name).join(", ") : "No table"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
