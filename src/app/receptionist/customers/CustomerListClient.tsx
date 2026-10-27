"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, User, Trophy, Phone, Calendar, Crown } from "lucide-react";

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    visitCount: number;
    lastVisit: Date | null;
};

export default function CustomerListClient({ customers }: { customers: Customer[] }) {
    const [query, setQuery] = useState("");

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.phone && c.phone.includes(query))
    );

    return (
        <>
            <div className="relative mt-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search by name or phone..."
                    className="pl-9 bg-muted/50"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="space-y-3 pb-20 mt-4">
                {filtered.map((cust, index) => {
                    // We keep rank based on original array index or filtered? 
                    // Usually rank is absolute based on their visitCount compared to all customers.
                    // Let's find their original rank.
                    const rank = customers.findIndex(c => c.id === cust.id) + 1;
                    const isTop3 = rank <= 3 && cust.visitCount > 0;
                    const isVip = rank <= 10 && cust.visitCount > 0;

                    const rankColors = [
                        "bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-400",
                        "bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-800/40 dark:border-slate-600 dark:text-slate-400",
                        "bg-orange-100 border-orange-300 text-orange-600 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-400",
                    ];

                    // index for rankColors should be rank - 1
                    const rankColorIndex = rank - 1;

                    return (
                        <Card key={cust.id} className={cn("border-border/60", isTop3 && "ring-1 ring-primary/20", isVip && !isTop3 && "border-amber-200 bg-amber-50/30")}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center border-2",
                                            isTop3 ? rankColors[rankColorIndex] : isVip ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-muted border-border text-muted-foreground"
                                        )}>
                                            {isTop3 ? <Crown size={18} /> : isVip ? <Trophy size={18} /> : <User size={18} />}
                                        </div>
                                        {isTop3 && (
                                            <span className={cn(
                                                "absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black border",
                                                rankColors[rankColorIndex]
                                            )}>
                                                {rank}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm flex items-center gap-2">
                                            {cust.name}
                                            {isVip && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded-full border border-amber-200">VIP</span>}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span className="flex items-center gap-1"><Phone size={10} /> {cust.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-primary">{cust.visitCount}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Visits</div>
                                </div>
                            </CardContent>
                            <div className="px-4 py-2 bg-muted/30 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground rounded-b-2xl">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} /> Last: {cust.lastVisit ? new Date(cust.lastVisit).toLocaleDateString() : "Never"}
                                </span>
                            </div>
                        </Card>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No customers match your search.
                    </div>
                )}
            </div>
        </>
    );
}
