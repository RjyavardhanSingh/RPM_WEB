/*
  Warnings:

  - Added the required column `scheduledAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL;
