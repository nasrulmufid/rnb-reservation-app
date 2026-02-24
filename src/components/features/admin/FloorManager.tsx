"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { createFloor, updateFloor, deleteFloor } from "@/actions/floors";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Floor {
    id: number;
    name: string;
    _count?: {
        tables: number;
    };
}

export function FloorManager({ floors: initialFloors }: { floors: Floor[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await createFloor({
            name: formData.get("name") as string,
        });

        if (result.success) {
            toast.success("Floor created successfully");
            // Optional: You might want to refresh the list via router.refresh() 
            // but since we are receiving props, the parent page refresh handles it.
            // However, we are inside a client component inside a server component.
            // revalidatePath in action handles the data refresh on next render.
            // But to see it immediately we rely on Next.js server action behavior.
        } else {
            toast.error(result.error || "Failed to create floor");
        }
        setLoading(false);
        // Don't close main dialog, just reset form? 
        // Actually this is a specific form submission.
        // Let's assume we want to stay in manager.
    }

    async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editingFloor) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await updateFloor(editingFloor.id, {
            name: formData.get("name") as string,
        });

        if (result.success) {
            toast.success("Floor updated successfully");
            setEditingFloor(null);
        } else {
            toast.error(result.error || "Failed to update floor");
        }
        setLoading(false);
    }

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this floor?")) return;
        setLoading(true);
        const result = await deleteFloor(id);
        if (result.success) {
            toast.success("Floor deleted successfully");
        } else {
            toast.error(result.error || "Failed to delete floor");
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Layers size={16} />
                    Manage Floors
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Floor Management</DialogTitle>
                    <DialogDescription>
                        Add, edit, or remove restaurant floors.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add/Edit Form */}
                    <div className="rounded-lg border p-4 bg-muted/50">
                        <h3 className="font-medium mb-4 flex items-center justify-between">
                            {editingFloor ? "Edit Floor" : "Add New Floor"}
                            {editingFloor && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingFloor(null)}
                                    className="h-6 w-6 p-0"
                                >
                                    <X size={14} />
                                </Button>
                            )}
                        </h3>
                        <form
                            onSubmit={editingFloor ? handleUpdate : handleCreate}
                            className="flex gap-2 items-end"
                        >
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="floor-name">Floor Name</Label>
                                <Input
                                    id="floor-name"
                                    name="name"
                                    placeholder="e.g. Roof Top"
                                    defaultValue={editingFloor?.name || ""}
                                    key={editingFloor?.id || "new"} // Force re-render on switch
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingFloor ? "Save" : "Add")}
                            </Button>
                        </form>
                    </div>

                    {/* Floor List */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Tables</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialFloors.map((floor) => (
                                    <TableRow key={floor.id}>
                                        <TableCell>{floor.id}</TableCell>
                                        <TableCell className="font-medium">{floor.name}</TableCell>
                                        <TableCell>{floor._count?.tables || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setEditingFloor(floor)}
                                                >
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    disabled={!!floor._count?.tables}
                                                    title={floor._count?.tables ? "Cannot delete floor with tables" : "Delete floor"}
                                                    onClick={() => handleDelete(floor.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {initialFloors.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No floors found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
