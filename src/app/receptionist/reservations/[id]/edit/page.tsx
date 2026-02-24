import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditReservationForm from "./form";

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
            tables: { select: { tableId: true } }
        },
    });

    if (!reservation) {
        notFound();
    }

    return <EditReservationForm initialData={reservation} />;
}
