
import { createTable, updateTable, deleteTable } from "./src/actions/tables";
import { prisma } from "./src/lib/prisma";

async function main() {
    console.log("Starting verification...");

    // 1. Create Table
    console.log("Creating table...");
    const createRes = await createTable({
        name: "TEST-UPDATE-1",
        capacity: 4,
        floorId: 1
    });

    if (!createRes.success || !createRes.data) {
        console.error("Failed to create table:", createRes.error);
        return;
    }
    const tableId = createRes.data.id;
    console.log("Table created:", tableId);

    // 2. Verify Exists
    let table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
        console.error("Table not found after creation!");
        return;
    }
    console.log("Table exists.");

    // 3. Update Table
    console.log("Updating table...");
    const updateRes = await updateTable(tableId, {
        name: "TEST-UPDATE-1-MOD",
        capacity: 6,
        floorId: 1
    });

    if (!updateRes.success) {
        console.error("Failed to update table:", updateRes.error);
    } else {
        console.log("Update success.");
    }

    // 4. Verify Exists (Check for deletion bug)
    table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
        console.error("CRITICAL: Table DELETED after update!");
    } else {
        console.log("Table still exists after update. Name:", table.name);
        if (table.name !== "TEST-UPDATE-1-MOD") {
            console.error("Table name was not updated correctly.");
        }
    }

    // 5. Cleanup
    console.log("Cleaning up...");
    await deleteTable(tableId);
    console.log("Done.");
}

main().catch(console.error);
