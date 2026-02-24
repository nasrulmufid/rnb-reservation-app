
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying 'system' user...");

    const systemUser = await prisma.user.findUnique({
        where: { id: "system" },
    });

    if (systemUser) {
        console.log("✅ System user found:", systemUser);
    } else {
        console.error("❌ System user NOT found!");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
