"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Plus, UserPlus } from "lucide-react";
import { createCustomer } from "@/actions/customers";

export default function AddGuestForm() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!name.trim() || !phone.trim()) {
            setError("Name and phone are required");
            return;
        }

        startTransition(async () => {
            const result = await createCustomer({ name: name.trim(), phone: phone.trim() });
            if (result.success) {
                setName("");
                setPhone("");
                setError("");
                setOpen(false);
            } else {
                setError(result.error || "Failed to add guest");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setError(""); } }}>
            <DialogTrigger asChild>
                <button className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Plus size={14} /> New
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus size={18} className="text-primary" />
                        Add New Customer
                    </DialogTitle>
                    <DialogDescription>
                        Enter the customer&apos;s name and phone number.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg px-3 py-2 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Customer Name *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mr. / Mrs. / Ms."
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Phone Number *</label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            type="tel"
                        />
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Adding..." : "Add Customer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
