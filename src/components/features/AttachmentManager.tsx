"use client";

import { useRef, useState } from "react";
import { Paperclip, Trash2, FileText, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AttachmentItem = {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    description?: string | null;
};

interface AttachmentManagerProps {
    /** Empty string = pending mode (files held locally until reservation is created) */
    reservationId: string;
    initialAttachments?: AttachmentItem[];
    readOnly?: boolean;
    /** Pending mode: called when locally selected files change */
    onPendingFilesChange?: (files: File[]) => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToItem(file: File): AttachmentItem {
    return {
        id: `pending-${file.name}-${file.lastModified}-${file.size}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        description: null,
    };
}

export default function AttachmentManager({
    reservationId,
    initialAttachments = [],
    readOnly = false,
    onPendingFilesChange,
}: AttachmentManagerProps) {
    const pendingMode = !reservationId;

    const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const displayItems: AttachmentItem[] = pendingMode
        ? pendingFiles.map(fileToItem)
        : attachments;

    function validateFiles(files: File[]): string | null {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
        for (const file of files) {
            if (!allowed.includes(file.type)) {
                return `File type not allowed: ${file.name}. Allowed: JPG, PNG, WEBP, HEIC, PDF`;
            }
            if (file.size > 5 * 1024 * 1024) {
                return `File too large (max 5 MB): ${file.name}`;
            }
            if (file.size === 0) {
                return `Empty file: ${file.name}`;
            }
        }
        if (pendingMode && pendingFiles.length + files.length > 10) {
            return "Max 10 files per reservation";
        }
        return null;
    }

    function handleFilesSelected(files: FileList | null) {
        if (!files || files.length === 0) return;
        setError("");
        const selected = Array.from(files);
        const validationError = validateFiles(selected);
        if (validationError) {
            setError(validationError);
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        if (pendingMode) {
            const next = [...pendingFiles, ...selected];
            setPendingFiles(next);
            onPendingFilesChange?.(next);
        } else {
            uploadFiles(selected);
        }

        if (inputRef.current) inputRef.current.value = "";
    }

    async function uploadFiles(files: File[]) {
        setError("");
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("reservationId", reservationId);
            files.forEach((f) => formData.append("files", f));

            const res = await fetch("/api/attachments", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Upload failed");
            } else {
                setAttachments((prev) => [...prev, ...(data.attachments || [])]);
            }
        } catch {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    function removePending(id: string) {
        const next = pendingFiles.filter((f) => fileToItem(f).id !== id);
        setPendingFiles(next);
        onPendingFilesChange?.(next);
    }

    async function handleDelete(id: string) {
        setError("");
        const prev = attachments;
        setAttachments((cur) => cur.filter((a) => a.id !== id));
        try {
            const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to delete");
                setAttachments(prev);
            }
        } catch {
            setError("Failed to delete");
            setAttachments(prev);
        }
    }

    async function handleRemove(id: string) {
        if (pendingMode) {
            removePending(id);
        } else {
            await handleDelete(id);
        }
    }

    const isImage = (mime: string) => mime.startsWith("image/");

    return (
        <div className="space-y-2">
            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                <Paperclip size={12} />
                Attachments (DP transfer proof, etc.)
            </label>

            {!readOnly && (
                <div
                    className={cn(
                        "border border-dashed border-border rounded-lg p-3 text-center transition-colors",
                        uploading ? "opacity-60" : "hover:bg-muted/40 cursor-pointer"
                    )}
                    onClick={() => !uploading && inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.pdf"
                        className="hidden"
                        onChange={(e) => handleFilesSelected(e.target.files)}
                        disabled={uploading}
                    />
                    {uploading ? (
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Loader2 size={14} className="animate-spin" />
                            Uploading...
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Tap to upload</span> — JPG, PNG, WEBP, HEIC or PDF · max 5 MB
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-start gap-1.5 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-2.5 py-1.5">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            {displayItems.length > 0 && (
                <div className="space-y-1.5">
                    {displayItems.map((a) => (
                        <div
                            key={a.id}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30 text-xs"
                        >
                            <div className="h-8 w-8 rounded-md bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                {isImage(a.mimeType) && !pendingMode ? (
                                    <img
                                        src={`/api/attachments/${a.id}/file`}
                                        alt={a.fileName}
                                        className="h-full w-full rounded-md object-cover"
                                    />
                                ) : (
                                    <FileText size={14} className="text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                {pendingMode ? (
                                    <span className="font-medium text-foreground truncate block">
                                        {a.fileName}
                                    </span>
                                ) : (
                                    <a
                                        href={`/api/attachments/${a.id}/file`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-foreground truncate block hover:underline"
                                    >
                                        {a.fileName}
                                    </a>
                                )}
                                <div className="text-[10px] text-muted-foreground">
                                    {formatSize(a.size)}
                                    {a.description ? ` · ${a.description}` : ""}
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(a.id)}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                    title={pendingMode ? "Remove file" : "Delete attachment"}
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
