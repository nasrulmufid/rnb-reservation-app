import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { UserCircle2 } from "lucide-react";

export default async function AdminLogsPage() {
    const logs = await prisma.systemLog.findMany({
        take: 50,
        orderBy: { timestamp: "desc" },
        include: { user: { select: { username: true } } },
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    No logs found
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <UserCircle2 size={16} className="text-muted-foreground" />
                                            {log.user.username}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-muted text-xs font-bold font-mono">
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">{log.details}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
