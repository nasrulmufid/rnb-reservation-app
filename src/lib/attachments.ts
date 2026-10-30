import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Attachment storage helper.
 * Files are stored on disk in a configurable directory (default: <cwd>/data/uploads)
 * and metadata is stored in the ReservationAttachment table.
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file

export const ALLOWED_MIME_TYPES: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "application/pdf": ".pdf",
};

export function getAllowedExtensions(): string {
    return Object.values(ALLOWED_MIME_TYPES).join(", ").replace(/\./g, "*.");
}

export function getUploadDir(): string {
    return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

export function getExtensionFromName(name: string): string {
    const ext = path.extname(name).toLowerCase();
    return ext && ext.length <= 6 ? ext : "";
}

export function getExtensionFromMime(mime: string): string {
    return ALLOWED_MIME_TYPES[mime] ?? "";
}

export function isAllowedMime(mime: string): boolean {
    return mime in ALLOWED_MIME_TYPES;
}

export function isValidFile(file: File): { valid: boolean; error?: string } {
    if (!isAllowedMime(file.type)) {
        return { valid: false, error: `File type not allowed: ${file.type || "unknown"}. Allowed: JPG, PNG, WEBP, HEIC, PDF` };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large (max 5 MB): ${file.name}` };
    }
    if (file.size === 0) {
        return { valid: false, error: `Empty file: ${file.name}` };
    }
    return { valid: true };
}

/** Persist a File to disk, returns the generated stored name. */
export async function saveFile(file: File): Promise<string> {
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const ext = getExtensionFromMime(file.type) || getExtensionFromName(file.name) || ".bin";
    const storedName = `${Date.now()}-${randomUUID()}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, storedName), buffer);

    return storedName;
}

/** Read a stored file from disk. Returns null when missing. */
export async function readStoredFile(storedName: string): Promise<Buffer | null> {
    try {
        return await readFile(path.join(getUploadDir(), storedName));
    } catch {
        return null;
    }
}

/** Delete a stored file from disk. Silently ignores missing files. */
export async function deleteStoredFile(storedName: string): Promise<void> {
    try {
        await unlink(path.join(getUploadDir(), storedName));
    } catch {
        // ignore: file may already be gone
    }
}
