"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Trophy, User, Check, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { updateReservation } from "@/actions/reservations";
import { cn } from "@/lib/utils";

type CustomerSuggestion = {
    id: string;
    name: string;
    phone: string;
    isVip: boolean;
    visitCount: number;
};

interface EditReservationFormProps {
    initialData: {
        id: string;
        date: Date;
        time: string;
        pax: number;
        remarks: string | null;
        customer: {
            name: string;
            phone: string;
        };
        status: string;
        tables: { tableId: string }[];
    };
}

export default function EditReservationForm({ initialData }: EditReservationFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [tables, setTables] = useState<{ id: string; name: string; capacity: number; floor: number; isBooked?: boolean; conflictReason?: string }[]>([]);

    // Initialize state from props
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>(initialData.tables.map(t => t.tableId));
    const [pastDateWarning, setPastDateWarning] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Initialize form fields
    const initialDateStr = new Date(initialData.date).toISOString().split("T")[0];
    const [date, setDate] = useState(initialDateStr);
    const [time, setTime] = useState(initialData.time);
    const [loadingTables, setLoadingTables] = useState(false);

    // Customer state
    const [name, setName] = useState(initialData.customer.name);
    const [phone, setPhone] = useState(initialData.customer.phone);

    const isLocked = ["COMPLETED", "CANCELLED"].includes(initialData.status);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeField, setActiveField] = useState<"name" | "phone" | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        setLoadingTables(true);
        const params = new URLSearchParams();
        if (date) params.set("date", date);
        if (time) params.set("time", time);
        // Exclude current reservation from conflict checks
        params.set("excludeReservationId", initialData.id);

        fetch(`/api/tables?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => setTables(data))
            .catch(() => { })
            .finally(() => setLoadingTables(false));
    }, [date, time, initialData.id]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function searchCustomers(query: string, field: "name" | "phone") {
        clearTimeout(debounceRef.current);
        setActiveField(field);
        if (query.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch {
                setSuggestions([]);
            }
        }, 200);
    }

    function selectCustomer(customer: CustomerSuggestion) {
        setName(customer.name);
        setPhone(customer.phone);
        setShowSuggestions(false);
        setSuggestions([]);
    }

    function toggleTable(tableId: string) {
        setSelectedTableIds((prev) =>
            prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
        );
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        const formData = new FormData(e.currentTarget);
        const selectedDate = formData.get("date") as string;

        if (selectedDate < todayStr) {
            setPendingFormData(formData);
            setPastDateWarning(true);
            return;
        }

        await submitReservation(formData);
    }

    async function submitReservation(formData: FormData) {
        setLoading(true);
        const result = await updateReservation(initialData.id, {
            name: formData.get("name") as string,
            phone: formData.get("phone") as string,
            date: formData.get("date") as string,
            time: formData.get("time") as string,
            pax: parseInt(formData.get("pax") as string),
            tableIds: selectedTableIds.length > 0 ? selectedTableIds : undefined,
            remarks: (formData.get("remarks") as string) || undefined,
        });

        if (result.success) {
            router.push("/receptionist/reservations");
            router.refresh();
        } else {
            setError(result.error || "Failed to update reservation");
        }
        setLoading(false);
    }

    function confirmPastDate() {
        setPastDateWarning(false);
        if (pendingFormData) {
            submitReservation(pendingFormData);
            setPendingFormData(null);
        }
    }

    const totalCapacity = tables
        .filter((t) => selectedTableIds.includes(t.id))
        .reduce((sum, t) => sum + t.capacity, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">Edit Reservation</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pb-20">
                {error && (
                    <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg px-4 py-2 text-sm">
                        {error}
                    </div>
                )}

                {isLocked && (
                    <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">Reservation is {initialData.status}</p>
                            <p className="text-amber-700 mt-1">This reservation cannot be edited because it is already {initialData.status.toLowerCase()}.</p>
                        </div>
                    </div>
                )}

                {/* Customer Details */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="relative" ref={suggestionsRef}>
                            <label className="text-xs text-muted-foreground mb-1 block">Customer Name *</label>
                            <Input
                                name="name"
                                placeholder="Mr. / Mrs. / Ms."
                                required
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    searchCustomers(e.target.value, "name");
                                }}
                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                autoComplete="off"
                                disabled={isLocked}
                            />

                            {/* Suggestions Dropdown */}
                            {showSuggestions && activeField === "name" && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                                    {suggestions.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => selectCustomer(c)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                                        >
                                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                {c.isVip ? <Trophy size={12} className="text-amber-500" /> : <User size={12} className="text-muted-foreground" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium flex items-center gap-1.5">
                                                    {c.name}
                                                    {c.isVip && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">VIP</span>}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{c.phone} · {c.visitCount} visits</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <label className="text-xs text-muted-foreground mb-1 block">Phone Number *</label>
                            <Input
                                name="phone"
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                required
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    searchCustomers(e.target.value, "phone");
                                }}
                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                autoComplete="off"
                                disabled={isLocked}
                            />

                            {/* Suggestions Dropdown for phone */}
                            {showSuggestions && activeField === "phone" && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                                    {suggestions.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => selectCustomer(c)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                                        >
                                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                {c.isVip ? <Trophy size={12} className="text-amber-500" /> : <User size={12} className="text-muted-foreground" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">{c.phone}</div>
                                                <div className="text-xs text-muted-foreground">{c.name} · {c.visitCount} visits</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Reservation Details */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Reservation Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
                                <Input
                                    name="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={todayStr}
                                    required
                                    disabled={isLocked}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Time *</label>
                                <Input
                                    name="time"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                    disabled={isLocked}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Number of Guests *</label>
                            <Input name="pax" type="number" min="1" max="20" defaultValue={initialData.pax} required disabled={isLocked} />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                                <span>
                                    Tables
                                    <Link href="/receptionist/map" className="text-primary text-[10px] ml-2 inline-flex items-center gap-0.5">
                                        <MapPin size={8} /> View Map
                                    </Link>
                                </span>
                                {selectedTableIds.length > 0 && (
                                    <span className="text-[10px] text-primary font-medium">
                                        {selectedTableIds.length} selected · Cap: {totalCapacity}
                                    </span>
                                )}
                            </label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {tables.map((t) => {
                                    const isSelected = selectedTableIds.includes(t.id);
                                    const isBooked = t.isBooked;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => !isBooked && toggleTable(t.id)}
                                            disabled={isBooked || isLocked}
                                            className={cn(
                                                "flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                                                    : isBooked
                                                        ? "opacity-50 cursor-not-allowed bg-muted"
                                                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60",
                                                isLocked && "opacity-60 cursor-not-allowed"
                                            )}
                                            title={isBooked ? t.conflictReason || "Table unavailable" : undefined}
                                        >
                                            <div className={cn(
                                                "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/40",
                                                isBooked && "bg-muted border-muted-foreground/20"
                                            )}>
                                                {isSelected && <Check size={10} className="text-primary-foreground" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium flex items-center justify-between">
                                                    {t.name}
                                                    {isBooked && <span className="text-[9px] text-red-500 font-bold ml-1">BOOKED</span>}
                                                </div>
                                                <div className="text-[10px] opacity-70">
                                                    {isBooked ? (
                                                        <span className="text-red-500/80 truncate block max-w-[100px]">{t.conflictReason?.replace("Booked at ", "")}</span>
                                                    ) : (
                                                        `Cap: ${t.capacity} · F${t.floor}`
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {tables.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-3">No tables available</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Remarks</label>
                            <Input name="remarks" placeholder="Special requests, birthday, etc." defaultValue={initialData.remarks || ""} disabled={isLocked} />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={loading || isLocked}>
                    {loading ? "Updating..." : "Update Reservation"}
                </Button>
            </form >

            {/* Past Date Warning Dialog */}
            <Dialog open={pastDateWarning} onOpenChange={(v) => { if (!v) { setPastDateWarning(false); setPendingFormData(null); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle size={20} />
                            Invalid Date
                        </DialogTitle>
                        <DialogDescription>
                            The selected date <strong className="text-foreground">{pendingFormData?.get("date") as string}</strong> is in the past. You cannot create a reservation for a date that has already passed. Please select today or a future date.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button">
                                Change Date
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
