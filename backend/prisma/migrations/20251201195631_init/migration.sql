/*
  Warnings:

  - You are about to drop the column `readAt` on the `books` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "books" DROP COLUMN "readAt",
ADD COLUMN     "finishedReadingAt" TIMESTAMP(3),
ADD COLUMN     "startedReadingAt" TIMESTAMP(3);
