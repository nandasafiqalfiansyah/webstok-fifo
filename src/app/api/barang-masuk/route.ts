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
    const barangMasuk = await prisma.barangMasuk.findMany({
      include: {
        produk: {
          select: {
            nama_produk: true,
            kategori: true
          }
        }
      },
      orderBy: {
        tanggal_masuk: 'desc'
      }
    });

    return NextResponse.json({
      status: 200,
      message: "Data barang masuk berhasil diambil",
      data: barangMasuk
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
    const { tanggal_masuk, jumlah, produk_id } = await request.json();

    if (!tanggal_masuk || !jumlah || !produk_id) {
      return NextResponse.json({
        status: 400,
        message: "Semua field harus diisi"
      });
    }

    const newBarangMasuk = await prisma.barangMasuk.create({
      data: {
        tanggal_masuk: new Date(tanggal_masuk),
        jumlah: parseInt(jumlah),
        produk_id: parseInt(produk_id)
      }
    });

    await prisma.produk.update({
      where: { id: parseInt(produk_id) },
      data: {
        stok: {
          increment: parseInt(jumlah)
        }
      }
    });

    return NextResponse.json({
      status: 201,
      message: "Barang masuk berhasil ditambahkan",
      data: newBarangMasuk
    });

  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Gagal menambahkan barang masuk",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

