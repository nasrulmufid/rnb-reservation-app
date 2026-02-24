import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Users, CalendarCheck, TrendingUp, TrendingDown, Armchair, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import WeeklyChart from "./WeeklyChart";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Current 7-day period
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Previous 7-day period (for comparison)
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
        totalReservations,
        totalCustomers,
        totalTables,
        availableTables,
        recentLogs,
        overdueCount,
        thisWeekReservations,
        lastWeekReservations,
        thisWeekCustomers,
        lastWeekCustomers,
    ] = await Promise.all([
        prisma.reservation.count({ where: { deletedAt: null } }),
        prisma.customer.count(),
        prisma.table.count(),
        prisma.table.count({ where: { isAvailable: true } }),
        prisma.systemLog.findMany({
            take: 5,
            orderBy: { timestamp: "desc" },
            include: { user: { select: { username: true } } },
        }),
        prisma.reservation.count({
            where: {
                status: "CONFIRMED",
                deletedAt: null,
                date: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        }),
        // This week reservations
        prisma.reservation.count({
            where: {
                deletedAt: null,
                createdAt: { gte: sevenDaysAgo, lt: tomorrow },
            },
        }),
        // Last week reservations
        prisma.reservation.count({
            where: {
                deletedAt: null,
                createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
            },
        }),
        // This week new customers
        prisma.customer.count({
            where: {
                createdAt: { gte: sevenDaysAgo, lt: tomorrow },
            },
        }),
        // Last week new customers
        prisma.customer.count({
            where: {
                createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
            },
        }),
    ]);

    const occupancyRate = totalTables > 0
        ? Math.round(((totalTables - availableTables) / totalTables) * 100)
        : 0;

    function calcPercent(current: number, previous: number) {
        if (previous === 0 && current === 0) return { value: 0, direction: "flat" as const };
        if (previous === 0) return { value: 100, direction: "up" as const };
        const pct = Math.round(((current - previous) / previous) * 100);
        if (pct > 0) return { value: pct, direction: "up" as const };
        if (pct < 0) return { value: Math.abs(pct), direction: "down" as const };
        return { value: 0, direction: "flat" as const };
    }

    const reservationTrend = calcPercent(thisWeekReservations, lastWeekReservations);
    const customerTrend = calcPercent(thisWeekCustomers, lastWeekCustomers);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Overview</h1>

            {/* Overdue Warning */}
            {overdueCount > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
                    <div>
                        <p className="font-semibold text-sm text-red-800 dark:text-red-300">{overdueCount} Overdue Reservation{overdueCount > 1 ? 's' : ''}</p>
                        <p className="text-xs text-red-600 dark:text-red-500">Confirmed but not completed within 24 hours. Please review and update.</p>
                    </div>
                </div>
            )}

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Reservations"
                    value={totalReservations.toString()}
                    icon={CalendarCheck}
                    description={`${thisWeekReservations} this week`}
                    trend={reservationTrend}
                />
                <StatsCard
                    title="Customers"
                    value={totalCustomers.toString()}
                    icon={Users}
                    description={`${thisWeekCustomers} new this week`}
                    trend={customerTrend}
                />
                <StatsCard
                    title="Occupancy"
                    value={`${occupancyRate}%`}
                    icon={occupancyRate > 50 ? TrendingUp : TrendingDown}
                    description={`${availableTables} tables free`}
                />
                <StatsCard
                    title="Tables"
                    value={totalTables.toString()}
                    icon={Armchair}
                    description="Across all floors"
                />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Weekly Reservations</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <WeeklyChart />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent activity</p>
                            ) : (
                                recentLogs.map((log: any) => (
                                    <div key={log.id} className="flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none">{log.action}</p>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{log.details}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {log.user.username}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, description, trend }: {
    title: string;
    value: string;
    icon: any;
    description: string;
    trend?: { value: number; direction: "up" | "down" | "flat" };
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                    <p className="text-xs text-muted-foreground">{description}</p>
                    {trend && trend.direction !== "flat" && (
                        <span className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            trend.direction === "up"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            {trend.direction === "up" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {trend.value}%
                        </span>
                    )}
                    {trend && trend.direction === "flat" && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            <Minus size={10} /> 0%
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
