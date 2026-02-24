"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Armchair, FileText, LogOut, Menu, X, Shield, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";

const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Overview", group: "Main" },
    { href: "/admin/reservations", icon: CalendarDays, label: "Reservations", group: "Main" },
    { href: "/admin/reports", icon: BarChart3, label: "Reports", group: "Main" },
    { href: "/admin/customers", icon: Users, label: "Customers", group: "Main" },
    { href: "/admin/users", icon: Shield, label: "Users", group: "Main" },
    { href: "/admin/tables", icon: Armchair, label: "Tables", group: "Main" },
    { href: "/admin/logs", icon: FileText, label: "Activity Logs", group: "System" },
];

export default function AdminSidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold mr-3 text-sm">
                    RB
                </div>
                <span className="font-bold text-lg tracking-tight">R&B Grill</span>
                {/* Close button - mobile only */}
                <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-muted-foreground hover:text-foreground">
                    <X size={20} />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {["Main", "System"].map((group) => (
                    <div key={group}>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-4 first:mt-0">
                            {group}
                        </div>
                        {navItems
                            .filter((item) => item.group === group)
                            .map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all group",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                        )}
                                    >
                                        <item.icon size={18} className={cn(isActive ? "text-primary" : "group-hover:text-primary transition-colors")} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                    </div>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border shrink-0">
                <form action={logout}>
                    <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all">
                        <LogOut size={18} />
                        Logout
                    </button>
                </form>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open menu"
            >
                <Menu size={18} />
            </button>

            {/* Desktop sidebar */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
                {sidebarContent}
            </aside>

            {/* Mobile drawer overlay */}
            {open && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setOpen(false)}
                    />
                    {/* Drawer */}
                    <aside className="absolute inset-y-0 left-0 w-72 bg-card border-r border-border flex flex-col animate-in slide-in-from-left duration-200 shadow-2xl">
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}
