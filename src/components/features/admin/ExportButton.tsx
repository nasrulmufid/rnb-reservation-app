"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useState } from "react";

interface ExportButtonProps {
    data: any[];
    startDate: string;
    endDate: string;
}

export function ExportButton({ data, startDate, endDate }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "Restaurant Reservation System";
            workbook.created = new Date();

            const sheet = workbook.addWorksheet("Reservations");

            // Define Columns
            sheet.columns = [
                { header: "Reservation No", key: "no", width: 20 },
                { header: "Date", key: "date", width: 15 },
                { header: "Time", key: "time", width: 10 },
                { header: "Customer Name", key: "name", width: 25 },
                { header: "Phone", key: "phone", width: 15 },
                { header: "Pax", key: "pax", width: 8 },
                { header: "Tables", key: "tables", width: 20 },
                { header: "Status", key: "status", width: 12 },
                { header: "Remarks", key: "remarks", width: 30 },
                { header: "Created By", key: "creator", width: 15 },
            ];

            // Style Header Row
            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
            headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF4F46E5" }, // Indigo 600
            };
            headerRow.alignment = { vertical: "middle", horizontal: "center" };
            headerRow.height = 30;

            // Add Data
            data.forEach((res, index) => {
                const row = sheet.addRow({
                    no: res.reservationNo,
                    date: new Date(res.date).toLocaleDateString(),
                    time: res.time,
                    name: res.customer.name,
                    phone: res.customer.phone,
                    pax: res.pax,
                    tables: res.tables.map((rt: any) => rt.table.name).join(", "),
                    status: res.status,
                    remarks: res.remarks || "-",
                    creator: res.createdBy?.username || "System",
                });

                // Zebra Striping
                if (index % 2 !== 0) {
                    row.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF3F4F6" }, // Gray 100
                    };
                }

                // Border for all cells
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFD1D5DB" } },
                        left: { style: "thin", color: { argb: "FFD1D5DB" } },
                        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
                        right: { style: "thin", color: { argb: "FFD1D5DB" } },
                    };
                    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
                });

                // Status Color Formatting
                const statusCell = row.getCell("status");
                if (res.status === "COMPLETED") {
                    statusCell.font = { color: { argb: "FF059669" }, bold: true }; // Emerald 600
                } else if (res.status === "CANCELLED") {
                    statusCell.font = { color: { argb: "FFDC2626" }, bold: true }; // Red 600
                } else if (res.status === "CONFIRMED") {
                    statusCell.font = { color: { argb: "FF2563EB" }, bold: true }; // Blue 600
                }
            });

            // Generate File
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `Reservation_Report_${startDate}_to_${endDate}.xlsx`);

        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export Excel file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleExport} disabled={loading || data.length === 0} className="gap-2">
            <Download size={16} />
            {loading ? "Exporting..." : "Export to Excel"}
        </Button>
    );
}
