import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { AddTableButton, EditTableButton, DeleteTableButton } from "@/components/features/admin/TableActions";
import { TableImportButton } from "@/components/features/admin/TableImport";
import { FloorManager } from "@/components/features/admin/FloorManager";

// Always render fresh data from the DB (never cache at build time)
export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
    const [tables, floors] = await Promise.all([
        prisma.table.findMany({
            orderBy: [{ floorId: "asc" }, { name: "asc" }],
            include: {
                floor: true,
                _count: { select: { reservations: true } },
            },
        }),
        prisma.floor.findMany({
            orderBy: { id: "asc" },
            include: {
                _count: { select: { tables: true } },
            },
        }),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Table Management</h1>
                <div className="flex gap-2">
                    <TableImportButton />
                    <FloorManager floors={floors} />
                    <Link href="/admin/tables/map">
                        <Button variant="outline" className="gap-2">
                            <LayoutGrid size={16} />
                            Visual Layout
                        </Button>
                    </Link>
                    <AddTableButton floors={floors} />
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Table Name</TableHead>
                            <TableHead>Floor</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Reservations</TableHead>
                            <TableHead>Current Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tables.map((table) => (
                            <TableRow key={table.id}>
                                <TableCell className="font-medium">{table.name}</TableCell>
                                <TableCell>{table.floor?.name || `Floor ${table.floorId}`}</TableCell>
                                <TableCell>{table.capacity} Pax</TableCell>
                                <TableCell>{table._count.reservations}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${table.isAvailable
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                        : "bg-rose-100 text-rose-800 border-rose-200"
                                        }`}>
                                        {table.isAvailable ? "Available" : "Occupied"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <EditTableButton table={table} floors={floors} />
                                        <DeleteTableButton id={table.id} name={table.name} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
