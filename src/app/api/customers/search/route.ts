import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 1) {
        return NextResponse.json([]);
    }

    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
            ],
        },
        take: 5,
        orderBy: { visitCount: "desc" },
        select: { id: true, name: true, phone: true, isVip: true, visitCount: true },
    });

    return NextResponse.json(customers);
}
