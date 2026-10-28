import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Crown, Download } from "lucide-react";

// Always render fresh data from the DB (never cache at build time)
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
    const customers = await prisma.customer.findMany({
        orderBy: { visitCount: "desc" },
        include: {
            _count: { select: { reservations: true } },
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Customer Analytics</h1>
                <Button variant="outline" className="gap-2">
                    <Download size={16} />
                    Export CSV
                </Button>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Total Visits</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No customers found
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((cust, index) => {
                                const isVip = index < 10 && cust.visitCount > 0;
                                return (
                                    <TableRow key={cust.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {isVip && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                                                {cust.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{cust.phone}</TableCell>
                                        <TableCell>{cust.visitCount}</TableCell>
                                        <TableCell>
                                            {cust.lastVisit ? new Date(cust.lastVisit).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${isVip
                                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                                : "bg-slate-100 text-slate-800 border-slate-200"
                                                }`}>
                                                {isVip ? "VIP" : "Regular"}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
