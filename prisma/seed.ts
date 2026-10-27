import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create Users
    const admin = await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: "admin",
            role: "ADMIN",
        },
    });

    const receptionist = await prisma.user.upsert({
        where: { username: "receptionist" },
        update: {},
        create: {
            username: "receptionist",
            password: "receptionist",
            role: "RECEPTIONIST",
        },
    });

    const system = await prisma.user.upsert({
        where: { id: "system" },
        update: {},
        create: {
            id: "system",
            username: "system",
            password: "system_password_secure_random_hash",
            role: "ADMIN",
        },
    });

    console.log("✅ Users created:", admin.username, receptionist.username, system.username);

    // Create Floors
    const floorData = [
        { id: 1, name: "Main Hall" },
        { id: 2, name: "Terrace" },
        { id: 3, name: "VIP Room" },
    ];

    for (const f of floorData) {
        await prisma.floor.upsert({
            where: { id: f.id },
            update: {},
            create: f,
        });
    }
    console.log("✅ Floors created:", floorData.length);

    // Create Tables
    const tableData = [
        { name: "T-01", capacity: 2, floorId: 1, positionX: 0, positionY: 0 },
        { name: "T-02", capacity: 4, floorId: 1, positionX: 1, positionY: 0 },
        { name: "T-03", capacity: 4, floorId: 1, positionX: 2, positionY: 0 },
        { name: "T-04", capacity: 6, floorId: 1, positionX: 0, positionY: 1 },
        { name: "T-05", capacity: 4, floorId: 1, positionX: 1, positionY: 1 },
        { name: "T-06", capacity: 2, floorId: 1, positionX: 2, positionY: 1 },
        { name: "T-07", capacity: 4, floorId: 1, positionX: 0, positionY: 2 },
        { name: "T-08", capacity: 8, floorId: 1, positionX: 1, positionY: 2 },
        { name: "O-01", capacity: 4, floorId: 2, positionX: 0, positionY: 0 },
        { name: "O-02", capacity: 6, floorId: 2, positionX: 1, positionY: 0 },
        { name: "O-03", capacity: 4, floorId: 2, positionX: 0, positionY: 1 },
        { name: "VIP-1", capacity: 10, floorId: 3, positionX: 0, positionY: 0 },
        { name: "VIP-2", capacity: 12, floorId: 3, positionX: 1, positionY: 0 },
    ];

    for (const t of tableData) {
        await prisma.table.upsert({
            where: { name: t.name },
            update: {},
            create: t,
        });
    }
    console.log("✅ Tables created:", tableData.length);

    // Create Customers
    const customers = [
        { name: "Mr. Alif", phone: "08123456789", visitCount: 8, isVip: true, lastVisit: new Date("2026-02-15") },
        { name: "Mrs. Sarah", phone: "08198765432", visitCount: 3, isVip: false, lastVisit: new Date("2026-02-10") },
        { name: "Bpk. Budi", phone: "08121234567", visitCount: 12, isVip: true, lastVisit: new Date("2026-02-18") },
        { name: "Ms. Putri", phone: "08134567890", visitCount: 1, isVip: false, lastVisit: new Date("2026-01-20") },
        { name: "Mr. John", phone: "08145678901", visitCount: 5, isVip: false, lastVisit: new Date("2025-12-30") },
    ];

    const createdCustomers = [];
    for (const c of customers) {
        const cust = await prisma.customer.upsert({
            where: { phone: c.phone },
            update: {},
            create: c,
        });
        createdCustomers.push(cust);
    }
    console.log("✅ Customers created:", customers.length);

    // Create sample Reservations
    const tables = await prisma.table.findMany();
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

    const reservationData = [
        { reservationNo: `RB-${dateStr}-001`, date: today, time: "18:30", pax: 4, status: "CONFIRMED" as const, remarks: "Window seat preferred", customerId: createdCustomers[0].id, tableId: tables[3]?.id, createdById: receptionist.id },
        { reservationNo: `RB-${dateStr}-002`, date: today, time: "19:00", pax: 2, status: "PENDING" as const, remarks: null, customerId: createdCustomers[1].id, tableId: tables[1]?.id, createdById: receptionist.id },
        { reservationNo: `RB-${dateStr}-003`, date: today, time: "19:30", pax: 8, status: "CONFIRMED" as const, remarks: "Birthday celebration", customerId: createdCustomers[2].id, tableId: tables[11]?.id, createdById: receptionist.id },
        { reservationNo: `RB-${dateStr}-004`, date: today, time: "20:00", pax: 3, status: "PENDING" as const, remarks: null, customerId: createdCustomers[3].id, tableId: tables[7]?.id, createdById: receptionist.id },
        { reservationNo: `RB-${dateStr}-005`, date: today, time: "20:30", pax: 5, status: "CANCELLED" as const, remarks: "Cancelled by guest", customerId: createdCustomers[4].id, tableId: tables[9]?.id, createdById: admin.id },
    ];

    for (const r of reservationData) {
        await prisma.reservation.upsert({
            where: { reservationNo: r.reservationNo },
            update: {},
            create: {
                reservationNo: r.reservationNo,
                date: r.date,
                time: r.time,
                pax: r.pax,
                status: r.status,
                remarks: r.remarks,
                customerId: r.customerId,
                createdById: r.createdById,
                tables: r.tableId ? {
                    create: [{ tableId: r.tableId }],
                } : undefined,
            },
        });
    }
    console.log("✅ Reservations created:", reservationData.length);

    // Create system logs
    await prisma.systemLog.createMany({
        data: [
            { action: "SYSTEM_INIT", details: "System initialized with seed data", userId: admin.id },
            { action: "CREATED_TABLE", details: "Created 13 tables across 3 floors", userId: admin.id },
        ],
    });
    console.log("✅ System logs created");

    console.log("\n🎉 Database seeded successfully!");
    console.log("   Login credentials:");
    console.log("   Admin: admin / admin");
    console.log("   Receptionist: receptionist / receptionist");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
