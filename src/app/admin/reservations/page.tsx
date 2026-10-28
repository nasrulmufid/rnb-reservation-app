import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { Clock, Search } from "lucide-react";
import Link from "next/link";
import StatusChanger from "@/components/features/StatusChanger";
import ReservationFilter from "@/components/features/ReservationFilter";

// Always render fresh data from the DB (never cache at build time)
export const dynamic = "force-dynamic";

export default async function AdminReservationsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; date?: string }>;
}) {
    const params = await searchParams;
    const statusFilter = params.status?.toUpperCase();
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    const activeFilter = validStatuses.includes(statusFilter || "") ? statusFilter : undefined;
    const dateFilter = params.date || undefined;

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
        orderBy: [{ date: "desc" }, { time: "asc" }],
        take: 50,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
                <Link href="/receptionist/reservations/new">
                    <Button>New Reservation</Button>
                </Link>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Filter reservations..." className="pl-9" />
                    </div>
                </div>

                <ReservationFilter activeFilter={activeFilter} activeDate={dateFilter} />
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[140px]">No.</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Pax</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No {activeFilter ? activeFilter.toLowerCase() : ""} reservations found
                                </TableCell>
                            </TableRow>
                        ) : (
                            reservations.map((res) => (
                                <TableRow key={res.id}>
                                    <TableCell className="font-mono text-xs">{res.reservationNo}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{res.customer.name}</div>
                                        <div className="text-xs text-muted-foreground">{res.customer.phone}</div>
                                        {res.remarks && (
                                            <div className="text-[10px] text-red-500 italic mt-1 max-w-[150px] truncate">
                                                Note: {res.remarks}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-muted-foreground" />
                                            <span>{res.time}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(res.date).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>{res.tables.length > 0 ? res.tables.map((rt: any) => rt.table.name).join(", ") : "—"}</TableCell>
                                    <TableCell>{res.pax}</TableCell>
                                    <TableCell>
                                        <StatusChanger reservationId={res.id} currentStatus={res.status} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
