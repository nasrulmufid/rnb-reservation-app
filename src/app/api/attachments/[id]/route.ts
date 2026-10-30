import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { deleteStoredFile } from "@/lib/attachments";

async function requireUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId || userId === "system") return null;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });
    return user?.id ?? null;
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await requireUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const attachment = await prisma.reservationAttachment.findUnique({
            where: { id },
            include: { reservation: { select: { reservationNo: true } } },
        });

        if (!attachment) {
            return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
        }

        await prisma.reservationAttachment.delete({ where: { id } });
        await deleteStoredFile(attachment.storedName);

        await prisma.systemLog.create({
            data: {
                action: "DELETE_ATTACHMENT",
                details: `Deleted attachment "${attachment.fileName}" from reservation ${attachment.reservation.reservationNo}`,
                userId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete attachment:", error);
        return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
    }
}
