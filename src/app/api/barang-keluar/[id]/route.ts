import { NextResponse } from "next/server";
import prisma from "./../../auth/option";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { tanggal_keluar, jumlah, produk_id } = await request.json();

    // Validasi input
    if (!tanggal_keluar || !jumlah || !produk_id) {
      return NextResponse.json({
        status: 400,
        message: "Semua field harus diisi"
      });
    }

    // Cek apakah barang keluar ada
    const barangKeluar = await prisma.barangKeluar.findUnique({
      where: { id: parseInt(id) }
    });

    if (!barangKeluar) {
      return NextResponse.json({
        status: 404,
        message: "Barang keluar tidak ditemukan"
      });
    }

    // Update barang keluar
    const updatedBarangKeluar = await prisma.barangKeluar.update({
      where: { id: parseInt(id) },
      data: {
        tanggal_keluar: new Date(tanggal_keluar),
        jumlah: parseInt(jumlah),
        produk_id: parseInt(produk_id)
      }
    });

    return NextResponse.json({
      status: 200,
      message: "Barang keluar berhasil diperbarui",
      data: updatedBarangKeluar
    });

  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Gagal memperbarui barang keluar",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Cek apakah barang keluar ada
    const barangKeluar = await prisma.barangKeluar.findUnique({
      where: { id: parseInt(id) }
    });

    if (!barangKeluar) {
      return NextResponse.json({
        status: 404,
        message: "Barang keluar tidak ditemukan"
      });
    }

    // Hapus barang keluar
    await prisma.barangKeluar.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      status: 200,
      message: "Barang keluar berhasil dihapus"
    });

  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Gagal menghapus barang keluar",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}