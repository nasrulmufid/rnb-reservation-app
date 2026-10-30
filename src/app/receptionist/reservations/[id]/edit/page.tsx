import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditReservationForm from "./form";

// Always render fresh data from the DB (never cache at build time)
export const dynamic = "force-dynamic";

export default async function EditReservationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
            customer: true,
            tables: { select: { tableId: true } },
            attachments: {
                select: {
                    id: true,
                    fileName: true,
                    mimeType: true,
                    size: true,
                    description: true,
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!reservation) {
        notFound();
    }

    return <EditReservationForm initialData={reservation} />;
}
