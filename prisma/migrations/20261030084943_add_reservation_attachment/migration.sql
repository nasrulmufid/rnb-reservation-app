/*
  Warnings:

  - A unique constraint covering the columns `[storedName]` on the table `ReservationAttachment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ReservationAttachment_reservationId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "ReservationAttachment_storedName_key" ON "ReservationAttachment"("storedName");
