"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import ViewAttachmentsDialog, { type ViewAttachment } from "./ViewAttachmentsDialog";

interface AttachmentBadgeProps {
    reservationId: string;
    attachments: ViewAttachment[];
    customerName?: string;
    reservationNo?: string;
    /** admin table style (stacked under customer) vs receptionist inline badge */
    variant?: "inline" | "block";
}

export default function AttachmentBadge({
    reservationId,
    attachments,
    customerName,
    reservationNo,
    variant = "inline",
}: AttachmentBadgeProps) {
    const [open, setOpen] = useState(false);

    if (attachments.length === 0) return null;

    const label = `${attachments.length} attachment(s)`;

    return (
        <>
            {variant === "inline" ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-1 text-primary hover:underline underline-offset-2"
                    title={`View ${label}`}
                >
                    <Paperclip size={10} /> {attachments.length}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline underline-offset-2"
                    title={`View ${label}`}
                >
                    <Paperclip size={10} /> {label}
                </button>
            )}

            <ViewAttachmentsDialog
                open={open}
                onOpenChange={setOpen}
                attachments={attachments}
                customerName={customerName}
                reservationNo={reservationNo}
            />
        </>
    );
}
