import AdminSidebar from "@/components/features/admin/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/20 font-sans flex">
            <AdminSidebar />

            {/* Main */}
            <main className="flex-1 md:ml-64 min-h-screen min-w-0 overflow-x-hidden">
                <header className="h-16 bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40 px-6 flex items-center justify-between">
                    {/* Spacer for mobile hamburger */}
                    <div className="w-9 md:hidden" />
                    <h2 className="font-semibold text-lg">Admin Portal</h2>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                            AD
                        </div>
                    </div>
                </header>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
