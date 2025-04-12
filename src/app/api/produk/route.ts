import { NextResponse } from "next/server";
import prisma from "../auth/option";

async function getAllProduk(): Promise<any[]> {
  try {
    const produk = await prisma.produk.findMany({
      include: {
        BarangMasuk: true,
        BarangKeluar: true,
      },
    });
    return produk;
  } catch (error) {
    throw new Error("Failed to retrieve produk");
  }
}

export async function GET(request: Request, { params }: { params?: { id: string } }) {
  try {
    if (params && params.id) {
      const produkId = parseInt(params.id, 10);
      if (isNaN(produkId)) {
        return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
      }

      const produk = await prisma.produk.findUnique({
        where: { id: produkId },
        include: {
          BarangMasuk: true,
          BarangKeluar: true,
        },
      });

      if (!produk) {
        return NextResponse.json({ message: "Produk not found" }, { status: 404 });
      }
      return NextResponse.json({ data: produk });
    }
    const produk = await getAllProduk();
    return NextResponse.json({ data: produk });

  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama_produk, kategori, harga, stok } = body;

    // Validasi sederhana (opsional bisa kamu tambah)
    if (!nama_produk || !kategori || !harga || !stok) {
      return NextResponse.json({ message: 'Data produk tidak lengkap.' }, { status: 400 });
    }

    // Simpan produk ke database
    const produk = await prisma.produk.create({
      data: {
        nama_produk,
        kategori,
        harga,
        stok,
      },
    });

    return NextResponse.json({ data: produk }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { id } = params;
    const { nama_produk, kategori, harga, stok } = body;
    if (!nama_produk || !kategori || !harga || !stok) {
      return NextResponse.json({ message: 'Data produk tidak lengkap.' }, { status: 400 });
    }
    const produk = await prisma.produk.update({
      where: { id: parseInt(id) },
      data: {
        nama_produk,
        kategori,
        harga,
        stok,
      },
    });
    return NextResponse.json({ data: produk }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const produk = await prisma.produk.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ data: produk }, { status: 200 });
  }
  catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
