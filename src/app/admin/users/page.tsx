
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers } from "@/actions/users";
import { AddUserButton, EditUserButton, DeleteUserButton } from "@/components/features/admin/UserActions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Shield, ShieldAlert, User as UserIcon } from "lucide-react";

// Always render fresh data from the DB (never cache at build time)
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
    const { success, data: users } = await getUsers();

    if (!success || !users) {
        return <div>Failed to load users.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage administrative and staff accounts.</p>
                </div>
                <AddUserButton />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <UserIcon size={16} />
                                        </div>
                                        <div>
                                            <div className="font-medium">{user.username}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{user.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="gap-1">
                                        {user.role === "ADMIN" ? <ShieldAlert size={12} /> : <Shield size={12} />}
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <EditUserButton user={user} />
                                        <DeleteUserButton id={user.id} username={user.username} />
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
