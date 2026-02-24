"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { getWeeklyStats } from "@/actions/dashboard";

const initialData = [
    { name: "Mon", total: 0 },
    { name: "Tue", total: 0 },
    { name: "Wed", total: 0 },
    { name: "Thu", total: 0 },
    { name: "Fri", total: 0 },
    { name: "Sat", total: 0 },
    { name: "Sun", total: 0 },
];

export default function WeeklyChart() {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        async function fetchStats() {
            try {
                const result = await getWeeklyStats();
                if (result.success && result.data) {
                    setData(result.data);
                }
            } catch (error) {
                console.error("Failed to load weekly chart:", error);
            }
        }
        fetchStats();
    }, []);

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
                <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
