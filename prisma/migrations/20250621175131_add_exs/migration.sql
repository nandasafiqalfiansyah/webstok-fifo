-- This is an empty migration.-- Migration: Tambah masa_exp ke BarangMasuk dan BarangKeluar

-- Tambah kolom masa_exp ke BarangMasuk
ALTER TABLE `BarangMasuk`
ADD COLUMN `masa_exp` DATE NULL;

-- Tambah kolom masa_exp ke BarangKeluar
ALTER TABLE `BarangKeluar`
ADD COLUMN `masa_exp` DATE NULL;
