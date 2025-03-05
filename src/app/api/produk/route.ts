import { NextResponse } from "next/server";
import prisma from "../auth/option";

// Get All Produk with Relations
async function getAllProduk(): Promise<any[]> {
  try {
    const produk = await prisma.produk.findMany({
      include: {
        BarangMasuk: true, // Ambil semua data BarangMasuk yang terkait
        BarangKeluar: true, // Ambil semua data BarangKeluar yang terkait
      },
    });
    return produk;
  } catch (error) {
    throw new Error("Failed to retrieve produk");
  }
}

// Unified GET function for both fetching all produk and a single produk by ID
export async function GET(request: Request, { params }: { params?: { id: string } }) {
  try {
    if (params && params.id) {
      // Jika ID diberikan, ambil produk berdasarkan ID
      const produkId = parseInt(params.id, 10);
      if (isNaN(produkId)) {
        return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
      }

      const produk = await prisma.produk.findUnique({
        where: { id: produkId },
        include: {
          BarangMasuk: true, // Ambil BarangMasuk terkait
          BarangKeluar: true, // Ambil BarangKeluar terkait
        },
      });

      if (!produk) {
        return NextResponse.json({ message: "Produk not found" }, { status: 404 });
      }
      return NextResponse.json({ data: produk });
    }

    // Jika tidak ada ID, ambil semua produk beserta relasinya
    const produk = await getAllProduk();
    return NextResponse.json({ data: produk });

  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
