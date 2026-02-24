"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/features/admin/ExportButton";
import { getReservationReport } from "@/actions/reports";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminReportsPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        cancelled: 0,
        pax: 0,
    });

    const fetchData = async () => {
        if (!date || !endDate) return;

        setLoading(true);
        const startStr = format(date, "yyyy-MM-dd");
        const endStr = format(endDate, "yyyy-MM-dd");

        const result = await getReservationReport(startStr, endStr);

        if (result.success && result.data) {
            setData(result.data);

            // Calculate Stats
            const total = result.data.length;
            const completed = result.data.filter((r: any) => r.status === "COMPLETED").length;
            const cancelled = result.data.filter((r: any) => r.status === "CANCELLED").length;
            const pax = result.data.reduce((sum: number, r: any) => sum + (r.status !== "CANCELLED" ? r.pax : 0), 0);

            setStats({ total, completed, cancelled, pax });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [date, endDate]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                <div className="flex items-center gap-2">
                    <ExportButton
                        data={data}
                        startDate={date ? format(date, "yyyy-MM-dd") : ""}
                        endDate={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    />
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Filter size={16} />
                        Filter Date Range
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="grid gap-2">
                        <span className="text-sm font-medium">Start Date</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <span className="text-sm font-medium">End Date</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button variant="ghost" size="icon" onClick={fetchData} className="mt-6">
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </Button>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">{stats.cancelled}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pax (Served)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.pax}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Preview Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Tables</TableHead>
                                    <TableHead>Pax</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading data...
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No reservations found in this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((res) => (
                                        <TableRow key={res.id}>
                                            <TableCell>
                                                <div className="font-medium">{format(new Date(res.date), "dd MMM yyyy")}</div>
                                                <div className="text-xs text-muted-foreground">{res.time}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{res.customer.name}</div>
                                                <div className="text-xs text-muted-foreground">{res.customer.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                {res.tables.map((rt: any) => rt.table.name).join(", ")}
                                            </TableCell>
                                            <TableCell>{res.pax}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "border",
                                                        res.status === "COMPLETED" && "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
                                                        res.status === "CONFIRMED" && "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                                                        res.status === "PENDING" && "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
                                                        res.status === "CANCELLED" && "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                                                    )}
                                                >
                                                    {res.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
