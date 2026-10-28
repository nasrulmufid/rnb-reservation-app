import { PrismaClient } from "@prisma/client";

/**
 * Production seed:
 * - Only creates the default administrator account (admin / admin).
 * - Leaves all business data (floors, tables, customers, reservations) empty.
 * - Idempotent: safe to run on every container start; it skips if admin already exists.
 */

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Production seeding (admin account only)...");

    const admin = await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: "admin",
            role: "ADMIN",
        },
    });

    // Ensure the "system" user exists — it is referenced as createdById
    // fallback for system-generated records (e.g. walk-in guests).
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

    console.log("✅ Admin user ready:", admin.username);
    console.log("✅ System user ready:", system.username);

    // Log initialization only once (when the admin was first created)
    const logCount = await prisma.systemLog.count({
        where: { action: "SYSTEM_INIT" },
    });
    if (logCount === 0) {
        await prisma.systemLog.create({
            data: {
                action: "SYSTEM_INIT",
                details: "Production database initialized (admin only)",
                userId: admin.id,
            },
        });
    }

    console.log("🎉 Production database ready!");
    console.log("   Login: admin / admin");
    console.log("   ⚠️  Change the default password after first login.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
