/*
  Warnings:

  - You are about to drop the column `shift` on the `student` table. All the data in the column will be lost.
  - Added the required column `shift` to the `class` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "class" ADD COLUMN     "shift" "Shift" NOT NULL;

-- AlterTable
ALTER TABLE "student" DROP COLUMN "shift";
