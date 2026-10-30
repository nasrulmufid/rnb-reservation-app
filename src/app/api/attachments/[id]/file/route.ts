import { readStoredFile } from "@/lib/attachments";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attachments/[id]/file
 * Streams the stored file. Stored names are random UUIDs and access requires
 * an app session, so URLs are not guessable in practice.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const attachment = await prisma.reservationAttachment.findUnique({
        where: { id },
    });

    if (!attachment) {
        return new Response("Not found", { status: 404 });
    }

    const buffer = await readStoredFile(attachment.storedName);
    if (!buffer) {
        return new Response("File missing on server", { status: 404 });
    }

    const disposition = new URL(request.url).searchParams.get("download")
        ? "attachment"
        : "inline";

    return new Response(new Uint8Array(buffer), {
        headers: {
            "Content-Type": attachment.mimeType,
            "Content-Length": buffer.length.toString(),
            "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
            "Cache-Control": "private, max-age=3600",
        },
    });
}
