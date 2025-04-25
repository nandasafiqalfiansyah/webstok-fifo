import { NextResponse } from "next/server";
import prisma from "./../../auth/option";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { tanggal_masuk, jumlah, produk_id } = await request.json();

    // Validasi input
    if (!tanggal_masuk || !jumlah || !produk_id) {
      return NextResponse.json({
        status: 400,
        message: "Semua field harus diisi"
      });
    }

    // Cek apakah barang masuk ada
    const barangMasuk = await prisma.barangMasuk.findUnique({
      where: { id: parseInt(id) }
    });

    if (!barangMasuk) {
      return NextResponse.json({
        status: 404,
        message: "Barang masuk tidak ditemukan"
      });
    }

    // Update barang masuk
    const updatedBarangMasuk = await prisma.barangMasuk.update({
      where: { id: parseInt(id) },
      data: {
        tanggal_masuk: new Date(tanggal_masuk),
        jumlah: parseInt(jumlah),
        produk_id: parseInt(produk_id)
      }
    });

    return NextResponse.json({
      status: 200,
      message: "Barang masuk berhasil diperbarui",
      data: updatedBarangMasuk
    });

  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Gagal memperbarui barang masuk",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Cek apakah barang masuk ada
    const barangMasuk = await prisma.barangMasuk.findUnique({
      where: { id: parseInt(id) }
    });

    if (!barangMasuk) {
      return NextResponse.json({
        status: 404,
        message: "Barang masuk tidak ditemukan"
      });
    }

    // Hapus barang masuk
    await prisma.barangMasuk.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      status: 200,
      message: "Barang masuk berhasil dihapus"
    });

  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Gagal menghapus barang masuk",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}