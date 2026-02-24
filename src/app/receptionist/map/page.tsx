"use client";

import OccupancyMap from "@/components/features/receptionist/OccupancyMap";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MapPage() {
    const router = useRouter();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">Floor Map</h1>
            </div>
            <OccupancyMap />
        </div>
    );
}
