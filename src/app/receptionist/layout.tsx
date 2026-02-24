import Link from "next/link";
import { Home, CalendarPlus, CalendarDays, Users, LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default function ReceptionistLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background font-sans flex justify-center">
            <div className="w-full max-w-[430px] relative">
                <div className="p-4 pb-24">{children}</div>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-md border-t border-border z-50">
                    <div className="flex items-center justify-around py-2">
                        <NavItem href="/receptionist/dashboard" icon={<Home size={20} />} label="Home" />
                        <NavItem href="/receptionist/reservations/new" icon={<CalendarPlus size={20} />} label="Add" />
                        <NavItem href="/receptionist/reservations" icon={<CalendarDays size={20} />} label="History" />
                        <NavItem href="/receptionist/customers" icon={<Users size={20} />} label="Customers" />
                        <form action={logout}>
                            <button type="submit" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-destructive transition-colors p-1">
                                <LogOut size={20} />
                                <span className="text-[10px]">Logout</span>
                            </button>
                        </form>
                    </div>
                </nav>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors p-1">
            {icon}
            <span className="text-[10px]">{label}</span>
        </Link>
    );
}
