import { NextResponse } from "next/server";
import prisma from "../auth/option";


interface Produk {
  id?: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
}

interface ProdukWithRelations extends Produk {
  BarangMasuk: any[];
  BarangKeluar: any[];
}

export async function GET(request: Request) {
  try {
    const barangKeluar = await prisma.barangKeluar.findMany({
      include: {
        produk: {
          select: {
            nama_produk: true,
            kategori: true
          }
        }
      },
      orderBy: {
        tanggal_keluar: 'desc'
      }
    });

    return NextResponse.json({
      status: 200,
      message: "Data barang keluar berhasil diambil",
      data: barangKeluar
    });

  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function POST(request: Request) {
  try {
    const { tanggal_keluar, jumlah, produk_id } = await request.json();

    // Validasi input
    if (!tanggal_keluar || !jumlah || !produk_id) {
      return NextResponse.json({
        status: 400,
        message: "Semua field harus diisi"
      });
    }

    // Cek stok tersedia
    const produk = await prisma.produk.findUnique({
      where: { id: parseInt(produk_id) }
    });

    if (!produk || produk.stok < parseInt(jumlah)) {
      return NextResponse.json({
        status: 400,
        message: "Stok produk tidak mencukupi"
      });
    }

    // Buat barang keluar baru
    const newBarangKeluar = await prisma.barangKeluar.create({
      data: {
        tanggal_keluar: new Date(tanggal_keluar),
        jumlah: parseInt(jumlah),
        produk_id: parseInt(produk_id)
      }
    });

    // Update stok produk
    await prisma.produk.update({
      where: { id: parseInt(produk_id) },
      data: {
        stok: {
          decrement: parseInt(jumlah)
        }
      }
    });

    return NextResponse.json({
      status: 201,
      message: "Barang keluar berhasil ditambahkan",
      data: newBarangKeluar
    });

  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Gagal menambahkan barang keluar",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}