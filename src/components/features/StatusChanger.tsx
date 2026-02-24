"use client";

import { useState, useTransition } from "react";
import { updateReservationStatus } from "@/actions/reservations";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

const statuses = [
    { value: "PENDING", label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" },
    { value: "CONFIRMED", label: "Confirmed", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700" },
    { value: "COMPLETED", label: "Completed", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700" },
] as const;

type Status = (typeof statuses)[number]["value"];

const LOCKED_STATUSES: string[] = ["COMPLETED", "CANCELLED"];

export default function StatusChanger({
    reservationId,
    currentStatus,
    compact = false,
}: {
    reservationId: string;
    currentStatus: string;
    compact?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState(currentStatus);

    const current = statuses.find((s) => s.value === status) || statuses[0];
    const isLocked = LOCKED_STATUSES.includes(status);

    function handleChange(newStatus: Status) {
        if (newStatus === status) {
            setOpen(false);
            return;
        }
        setStatus(newStatus);
        setOpen(false);
        startTransition(async () => {
            await updateReservationStatus(reservationId, newStatus);
        });
    }

    return (
        <div className="relative py-2">
            <button
                onClick={() => !isLocked && setOpen(!open)}
                disabled={isPending || isLocked}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all",
                    compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
                    current.color,
                    isPending && "opacity-50 cursor-wait",
                    isLocked && "opacity-75 cursor-not-allowed",
                    !isPending && !isLocked && "cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-current/20"
                )}
            >
                <span className="relative flex h-1.5 w-1.5">
                    {isPending && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                    )}
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                </span>
                {current.label}
                {isLocked ? (
                    <Lock size={10} />
                ) : (
                    <svg className={cn("h-3 w-3 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {open && !isLocked && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1">
                        {statuses.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => handleChange(s.value)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left",
                                    s.value === status && "font-bold"
                                )}
                            >
                                <span className={cn("h-2 w-2 rounded-full border", s.color)} />
                                {s.label}
                                {s.value === status && <span className="ml-auto text-primary">✓</span>}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
