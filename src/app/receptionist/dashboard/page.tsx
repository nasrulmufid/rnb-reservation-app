import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Utensils, CalendarCheck, ChevronRight, Clock, MapPin, AlertCircle, AlertTriangle, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export const dynamic = "force-dynamic";

export default async function ReceptionistDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayReservations, availableTables, totalCustomers, overdueReservations] = await Promise.all([
        prisma.reservation.findMany({
            where: {
                date: { gte: today, lt: tomorrow },
                deletedAt: null,
            },
            include: { customer: true, tables: { include: { table: true } } },
            orderBy: { time: "asc" },
        }),
        prisma.table.count({ where: { isAvailable: true } }),
        prisma.customer.count(),
        prisma.reservation.findMany({
            where: {
                status: "CONFIRMED",
                deletedAt: null,
                date: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            include: { customer: true },
            orderBy: { date: "asc" },
        }),
    ]);

    const totalPax = todayReservations.reduce((sum, r) => sum + r.pax, 0);
    const confirmedCount = todayReservations.filter(r => r.status === "CONFIRMED").length;
    const pendingCount = todayReservations.filter(r => r.status === "PENDING").length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Dashboard</h1>
                    <p className="text-xs text-muted-foreground">
                        {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    RB
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3 text-center">
                        <CalendarCheck className="h-5 w-5 mx-auto text-primary mb-1" />
                        <div className="text-xl font-bold">{todayReservations.length}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Reservations</div>
                        <div className="text-[9px] text-primary/60 mt-0.5">Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                    <CardContent className="p-3 text-center">
                        <Users className="h-5 w-5 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                        <div className="text-xl font-bold">{totalPax}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Pax</div>
                        <div className="text-[9px] text-emerald-500/60 mt-0.5">Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                    <CardContent className="p-3 text-center">
                        <Utensils className="h-5 w-5 mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                        <div className="text-xl font-bold">{availableTables}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Free Tables</div>
                        <div className="text-[9px] text-blue-500/60 mt-0.5">Available now</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Alert */}
            {pendingCount > 0 && (
                <Link href="/receptionist/reservations?status=PENDING" className="flex items-center justify-between p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <span className="font-semibold text-sm text-amber-800 dark:text-amber-300">{pendingCount} Unconfirmed</span>
                            <p className="text-[10px] text-amber-600 dark:text-amber-500">Tap to review pending reservations</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-amber-500" />
                </Link>
            )}

            {/* Overdue Alert */}
            {overdueReservations.length > 0 && (
                <Link href="/receptionist/reservations?status=CONFIRMED" className="flex items-center justify-between p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <span className="font-semibold text-sm text-red-800 dark:text-red-300">{overdueReservations.length} Overdue</span>
                            <p className="text-[10px] text-red-600 dark:text-red-500">Confirmed but not completed within 24h</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-red-500" />
                </Link>
            )}

            {/* Quick Actions */}
            <Link href="/receptionist/map" className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin size={16} className="text-primary" />
                    </div>
                    <span className="font-medium text-sm">Floor Map</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
            </Link>

            {/* Upcoming Reservations */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-semibold text-sm">Today&apos;s Schedule</h2>
                    <Link href="/receptionist/reservations?status=CONFIRMED" className="text-xs text-primary font-medium hover:underline">{confirmedCount} confirmed</Link>
                </div>
                <div className="space-y-2">
                    {todayReservations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No reservations today</p>
                    ) : (
                        todayReservations.map((res) => (
                            <Card key={res.id} className="border-border/60">
                                <CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center min-w-[40px]">
                                            <Clock size={12} className="text-muted-foreground mb-0.5" />
                                            <span className="text-sm font-bold">{res.time}</span>
                                            <span className="text-[9px] text-muted-foreground mt-0.5">{new Date(res.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                                        </div>
                                        <div className="border-l pl-3">
                                            <h3 className="font-semibold text-sm">{res.customer.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{res.pax} Pax</span>
                                                <span>•</span>
                                                <span>{res.tables?.length > 0 ? res.tables.map((rt: any) => rt.table.name).join(", ") : "No table"}</span>
                                            </div>
                                            {res.remarks && (
                                                <div className="text-[10px] text-muted-foreground mt-1 italic border-l-2 border-primary/20 pl-1.5 py-0.5">
                                                    {res.remarks}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${res.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
                                            res.status === "PENDING" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" :
                                                res.status === "CANCELLED" ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                                                    "bg-blue-100 text-blue-700 border-blue-200"
                                            }`}>
                                            {res.status}
                                        </span>
                                        <Link href={`/receptionist/reservations/${res.id}/edit`} className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Edit Reservation">
                                            <Pencil size={12} />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
