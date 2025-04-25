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

async function getAllProduk(): Promise<ProdukWithRelations[]> {
  return await prisma.produk.findMany({
    include: {
      BarangMasuk: true,
      BarangKeluar: true,
    },
  });
}

export async function getProdukById(id: number): Promise<ProdukWithRelations | null> {
  return await prisma.produk.findUnique({
    where: { id },
    include: {
      BarangMasuk: true,
      BarangKeluar: true,
    },
  });
}

function validateProdukData(data: Partial<Produk>): string | null {
  if (!data.nama_produk) return "Nama produk harus diisi";
  if (!data.kategori) return "Kategori harus diisi";
  if (data.harga === undefined || data.harga <= 0) return "Harga harus lebih dari 0";
  if (data.stok === undefined || data.stok < 0) return "Stok tidak boleh negatif";
  return null;
}

export async function GET(request: Request, { params }: { params?: { id: string } }) {
  try {
    if (params?.id) {
      const produkId = parseInt(params.id);
      if (isNaN(produkId)) {
        return NextResponse.json(
          { success: false, message: "ID produk tidak valid" },
          { status: 400 }
        );
      }

      const produk = await prisma.produk.findUnique({
        where: { id: produkId },
        include: {
          BarangMasuk: true,
          BarangKeluar: true,
        },
      });

      if (!produk) {
        return NextResponse.json(
          { success: false, message: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: produk });
    }

    const produk = await getAllProduk();
    return NextResponse.json({ success: true, data: produk });

  } catch (error) {
    console.error("Error in GET /api/produk:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama_produk, kategori, harga, stok } = body;

    // Validate input data
    const validationError = validateProdukData(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    // Create new product
    const produk = await prisma.produk.create({
      data: {
        nama_produk,
        kategori,
        harga: Number(harga),
        stok: Number(stok),
      },
    });

    return NextResponse.json(
      { success: true, data: produk },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error in POST /api/produk:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat produk" },
      { status: 500 }
    );
  }
}
