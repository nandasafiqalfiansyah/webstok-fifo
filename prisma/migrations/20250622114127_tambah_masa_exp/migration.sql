/*
  Warnings:

  - You are about to drop the column `masa_exp` on the `BarangKeluar` table. All the data in the column will be lost.
  - You are about to drop the column `masa_exp` on the `BarangMasuk` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `BarangKeluar` DROP COLUMN `masa_exp`;

-- AlterTable
ALTER TABLE `BarangMasuk` DROP COLUMN `masa_exp`;
