"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Paperclip, FileText, Image as ImageIcon, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewAttachment = {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    description?: string | null;
    createdAt?: string | Date;
};

interface ViewAttachmentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachments: ViewAttachment[];
    customerName?: string;
    reservationNo?: string;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ViewAttachmentsDialog({
    open,
    onOpenChange,
    attachments,
    customerName,
    reservationNo,
}: ViewAttachmentsDialogProps) {
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const isImage = (mime: string) => mime.startsWith("image/");
    const current = previewIndex !== null ? attachments[previewIndex] : null;

    function closePreview() {
        setPreviewIndex(null);
    }

    function step(delta: number) {
        if (previewIndex === null) return;
        const next = previewIndex + delta;
        if (next >= 0 && next < attachments.length) setPreviewIndex(next);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => { if (!v) { closePreview(); onOpenChange(false); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Paperclip size={16} className="text-primary" />
                            Attachments
                        </DialogTitle>
                        <DialogDescription>
                            {customerName}
                            {reservationNo ? ` · ${reservationNo}` : ""} · {attachments.length} file(s)
                        </DialogDescription>
                    </DialogHeader>

                    {attachments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No attachments</p>
                    ) : (
                        <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                            {attachments.map((a, i) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30 text-xs"
                                >
                                    <div className="h-9 w-9 rounded-md bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                        {isImage(a.mimeType) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={`/api/attachments/${a.id}/file`}
                                                alt={a.fileName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <FileText size={15} className="text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-foreground truncate">{a.fileName}</div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {formatSize(a.size)}
                                            {a.createdAt
                                                ? ` · ${new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                                                : ""}
                                            {a.description ? ` · ${a.description}` : ""}
                                        </div>
                                    </div>
                                    {isImage(a.mimeType) && (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewIndex(i)}
                                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                                            title="View image"
                                        >
                                            <ImageIcon size={14} />
                                        </button>
                                    )}
                                    <a
                                        href={`/api/attachments/${a.id}/file?download=1`}
                                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                                        title="Download"
                                    >
                                        <Download size={14} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Fullscreen image preview */}
            {current && isImage(current.mimeType) && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 flex flex-col"
                    onClick={closePreview}
                >
                    <div className="flex items-center justify-between p-4 text-white">
                        <div className="text-sm font-medium truncate max-w-[60%]">{current.fileName}</div>
                        <button
                            type="button"
                            onClick={closePreview}
                            className="text-white/80 hover:text-white text-xl leading-none px-2"
                            aria-label="Close preview"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-0 px-4 pb-6 relative">
                        {previewIndex !== null && previewIndex > 0 && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); step(-1); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/attachments/${current.id}/file`}
                            alt={current.fileName}
                            className={cn("max-h-full max-w-full object-contain rounded-lg")}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {previewIndex !== null && previewIndex < attachments.length - 1 && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); step(1); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                                aria-label="Next image"
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                    {attachments.length > 1 && (
                        <div className="text-center text-white/60 text-xs pb-4">
                            {previewIndex !== null ? previewIndex + 1 : 1} / {attachments.length}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
