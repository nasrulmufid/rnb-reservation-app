"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusFilters = [
    { value: undefined, label: "All" },
    { value: "PENDING", label: "Pending", dot: "bg-amber-500" },
    { value: "CONFIRMED", label: "Confirmed", dot: "bg-emerald-500" },
    { value: "COMPLETED", label: "Completed", dot: "bg-blue-500" },
    { value: "CANCELLED", label: "Cancelled", dot: "bg-red-500" },
];

interface ReservationFilterProps {
    activeFilter?: string;
    activeDate?: string;
    className?: string;
}

export default function ReservationFilter({
    activeFilter,
    activeDate,
    className,
}: ReservationFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function createQueryString(name: string, value: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null) {
            params.delete(name);
        } else {
            params.set(name, value);
        }
        return params.toString();
    }

    function handleStatusChange(status?: string) {
        const qs = createQueryString("status", status || null);
        router.push(`${pathname}?${qs}`);
    }

    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const date = e.target.value || null;
        const qs = createQueryString("date", date);
        router.push(`${pathname}?${qs}`);
    }

    function clearFilters() {
        router.push(pathname);
    }

    const hasActiveFilters = activeFilter || activeDate;

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 max-w-full no-scrollbar mask-gradient">
                    {statusFilters.map((f) => {
                        const isActive = activeFilter === f.value;
                        return (
                            <button
                                key={f.label}
                                onClick={() => handleStatusChange(f.value)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {f.dot && <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />}
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Date Filter & Clear */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm">
                        Date :
                    </span>
                    <div className="relative flex-1 sm:flex-initial">
                        <CalendarDays size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                            type="date"
                            value={activeDate || ""}
                            onChange={handleDateChange}
                            className="h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X size={14} className="mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
