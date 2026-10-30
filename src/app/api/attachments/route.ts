import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
    isValidFile,
    saveFile,
    deleteStoredFile,
    MAX_FILE_SIZE,
} from "@/lib/attachments";

const MAX_FILES_PER_RESERVATION = 10;

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

export async function POST(request: Request) {
    try {
        const userId = await requireUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const reservationId = formData.get("reservationId") as string | null;
        const description = (formData.get("description") as string | null)?.trim() || null;
        const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

        if (!reservationId) {
            return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
        }

        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            select: { id: true, reservationNo: true, deletedAt: true },
        });
        if (!reservation || reservation.deletedAt) {
            return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }

        if (files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const existingCount = await prisma.reservationAttachment.count({ where: { reservationId } });
        if (existingCount + files.length > MAX_FILES_PER_RESERVATION) {
            return NextResponse.json(
                { error: `Max ${MAX_FILES_PER_RESERVATION} files per reservation (currently ${existingCount})` },
                { status: 400 }
            );
        }

        // Validate all files before writing anything
        for (const file of files) {
            const check = isValidFile(file);
            if (!check.valid) {
                return NextResponse.json({ error: check.error }, { status: 400 });
            }
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({ error: "File too large" }, { status: 400 });
            }
        }

        const created = [];
        for (const file of files) {
            const storedName = await saveFile(file);
            try {
                const attachment = await prisma.reservationAttachment.create({
                    data: {
                        reservationId,
                        fileName: file.name,
                        storedName,
                        mimeType: file.type,
                        size: file.size,
                        description,
                    },
                });
                created.push(attachment);
            } catch (err) {
                // DB insert failed; don't leave orphan file on disk
                await deleteStoredFile(storedName);
                throw err;
            }
        }

        await prisma.systemLog.create({
            data: {
                action: "UPLOAD_ATTACHMENT",
                details: `Uploaded ${created.length} attachment(s) to reservation ${reservation.reservationNo}`,
                userId,
            },
        });

        return NextResponse.json({ success: true, attachments: created }, { status: 201 });
    } catch (error) {
        console.error("Failed to upload attachment:", error);
        return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
    }
}
