"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TableData = {
    id: string;
    name: string;
    capacity: number;
    floorId: number;
    floorName: string;
    isAvailable: boolean;
    reservations: { id: string; status: string; time: string; customer: { name: string } }[];
};

const statusColor: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
    booked: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
    occupied: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700",
};

export default function OccupancyMap() {
    const [tables, setTables] = useState<TableData[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
    const [activeFloorId, setActiveFloorId] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/tables/map")
            .then((r) => r.json())
            .then((data) => {
                setTables(data);
                if (data.length > 0 && !activeFloorId) {
                    const firstFloorId = data[0].floorId;
                    setActiveFloorId(firstFloorId);
                }
            })
            .catch(() => { });
    }, []);

    // Extract unique floors from table data
    const floors = Array.from(new Set(tables.map(t => t.floorId)))
        .map(id => {
            const table = tables.find(t => t.floorId === id);
            return { id, name: table?.floorName || `Floor ${id}` };
        })
        .sort((a, b) => a.id - b.id);

    // Default to first floor if activeFloorId not set and floors exist
    useEffect(() => {
        if (activeFloorId === null && floors.length > 0) {
            setActiveFloorId(floors[0].id);
        }
    }, [floors, activeFloorId]);

    const filteredTables = tables.filter((t) => t.floorId === activeFloorId);

    function getStatus(table: TableData) {
        if (!table.isAvailable) return "occupied";
        const hasActiveRes = table.reservations?.some(
            (r) => r.status === "CONFIRMED" || r.status === "PENDING"
        );
        return hasActiveRes ? "booked" : "available";
    }

    return (
        <div className="space-y-4">
            {/* Floor Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {floors.map((floor) => (
                    <button
                        key={floor.id}
                        onClick={() => setActiveFloorId(floor.id)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                            activeFloorId === floor.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        )}
                    >
                        {floor.name}
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Available</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500" /> Booked</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-rose-500" /> Occupied</span>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-3 gap-3">
                {filteredTables.map((table) => {
                    const status = getStatus(table);
                    return (
                        <button
                            key={table.id}
                            onClick={() => setSelectedTable(table)}
                            className={cn(
                                "p-3 rounded-xl border-2 text-center transition-all hover:scale-105",
                                statusColor[status]
                            )}
                        >
                            <div className="font-bold text-sm">{table.name}</div>
                            <div className="text-[10px] opacity-70">{table.capacity} Pax</div>
                        </button>
                    );
                })}
            </div>

            {filteredTables.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No tables on this floor</p>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedTable} onOpenChange={(open: boolean) => !open && setSelectedTable(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Table {selectedTable?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedTable && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-muted p-2 rounded-lg">
                                    <div className="text-xs text-muted-foreground">Capacity</div>
                                    <div className="font-bold">{selectedTable.capacity} Pax</div>
                                </div>
                                <div className="bg-muted p-2 rounded-lg">
                                    <div className="text-xs text-muted-foreground">Floor</div>
                                    <div className="font-bold">{selectedTable.floorName}</div>
                                </div>
                                <div className="bg-muted p-2 rounded-lg col-span-2">
                                    <div className="text-xs text-muted-foreground">Status</div>
                                    <div className="font-bold capitalize">{getStatus(selectedTable)}</div>
                                </div>
                            </div>
                            {selectedTable.reservations?.length > 0 && (
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground font-medium">Active Reservations</div>
                                    {selectedTable.reservations.map((r) => (
                                        <div key={r.id} className="text-sm flex justify-between bg-muted/50 p-2 rounded">
                                            <span>{r.customer.name}</span>
                                            <span className="text-muted-foreground">{r.time} - {r.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
