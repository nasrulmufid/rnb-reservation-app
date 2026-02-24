"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileDown, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { importTablesFromCSV } from "@/actions/table-import";
import { toast } from "sonner";

export function TableImportButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const formData = new FormData(e.currentTarget);
        const response = await importTablesFromCSV(formData);

        setResult(response);
        setLoading(false);

        if (response.success) {
            toast.success(`Successfully imported ${response.count} tables`);
            // Close dialog after delay
            setTimeout(() => {
                setOpen(false);
                setResult(null);
            }, 2000);
        } else {
            toast.error(response.error);
        }
    }

    function downloadTemplate() {
        const csvContent = "name,capacity,floor\nT-A1,4,1\nT-B1,6,2\nT-VIP,8,3";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "table_template.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload size={16} />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Tables</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk create or update tables.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <FileDown size={16} />
                            <span>Download format template</span>
                        </div>
                        <Button variant="link" size="sm" onClick={downloadTemplate} className="h-auto p-0">
                            Download CSV
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Select CSV File</Label>
                            <Input id="file" name="file" type="file" accept=".csv" required />
                        </div>

                        {result && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${result.success ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"}`}>
                                {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <span>{result.success ? `Imported ${result.count} tables successfully!` : result.error}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import Tables
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
