import { NextResponse } from "next/server";
import prisma from "../auth/option";

interface Produk {
  id?: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
}

interface BarangMasuk {
  id: number;
  produk_id: number;
  jumlah: number;
  tanggal_masuk: Date;
  masa_exp: Date | null;
}

interface BarangKeluar {
  id: number;
  produk_id: number;
  jumlah: number;
  tanggal_keluar: Date;
}

interface ProdukWithTransactions extends Produk {
  barang_masuk: BarangMasuk[];
  barang_keluar: BarangKeluar[];
}

interface KadaluarsaItem {
  id: number;
  produk_id: number;
  nama_produk: string;
  jumlah: number;
  tanggal_transaksi: Date;
  masa_exp: Date | null;
  tipe: 'masuk' | 'keluar';
  status_kadaluarsa: string;
  sisa_hari: number;
}

// async function getAllProduk(): Promise<ProdukWithTransactions[]> {
//   return await prisma.produk.findMany({
//     include: {
//       BarangMasuk: true,
//       BarangKeluar: true,
//     },
//   });
// }

function validateProdukData(data: Partial<Produk>): string | null {
  if (!data.nama_produk) return "Nama produk harus diisi";
  if (data.nama_produk.length > 32) return `Nama produk maksimal 32 karakter`;
  if (!data.kategori) return "Kategori harus diisi";
  if (!data.harga || data.harga <= 0) return "Harga harus lebih dari 0";
  if (data.stok === undefined || data.stok < 0) return "Stok tidak boleh negatif";
  return null;
}

function calculateExpirationStatus(expDate: Date | null): { status: string; sisa_hari: number } {
  if (!expDate) return { status: 'tidak ada', sisa_hari: 0 };
  
  const today = new Date();
  const exp = new Date(expDate);
  const diffTime = exp.getTime() - today.getTime();
  const sisa_hari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status = '';
  if (sisa_hari <= 0) {
    status = 'sudah kadaluarsa';
  } else if (sisa_hari <= 7) {
    status = 'akan kadaluarsa';
  } else if (sisa_hari <= 30) {
    status = 'perlu diperiksa';
  } else {
    status = 'masih lama';
  }

  return { status, sisa_hari };
}

export async function GET(request: Request, { params }: { params?: { id: string } }) {
  try {
    const url = new URL(request.url);
    const withExpired = url.searchParams.get('expired') === 'true';

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
          BarangMasuk: {
            orderBy: { tanggal_masuk: 'desc' },
            where: withExpired ? { masa_exp: { not: null } } : undefined
          },
          BarangKeluar: {
            orderBy: { tanggal_keluar: 'desc' }
          },
        },
      });

      if (!produk) {
        return NextResponse.json(
          { success: false, message: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }

      // Format response with expiration data
      const kadaluarsaItems: KadaluarsaItem[] = [];

      // Process incoming items
      produk.BarangMasuk.forEach((masuk) => {
        const { status, sisa_hari } = calculateExpirationStatus(masuk.masa_exp);
        kadaluarsaItems.push({
          id: masuk.id,
          produk_id: masuk.produk_id,
          nama_produk: produk.nama_produk,
          jumlah: masuk.jumlah,
          tanggal_transaksi: masuk.tanggal_masuk,
          masa_exp: masuk.masa_exp,
          tipe: 'masuk',
          status_kadaluarsa: status,
          sisa_hari
        });
      });

      // Process outgoing items
      produk.BarangKeluar.forEach((keluar) => {
        kadaluarsaItems.push({
          id: keluar.id,
          produk_id: keluar.produk_id,
          nama_produk: produk.nama_produk,
          jumlah: keluar.jumlah,
          tanggal_transaksi: keluar.tanggal_keluar,
          masa_exp: null,
          tipe: 'keluar',
          status_kadaluarsa: 'tidak berlaku',
          sisa_hari: 0
        });
      });

      // Sort by transaction date
      kadaluarsaItems.sort((a, b) => 
        new Date(b.tanggal_transaksi).getTime() - new Date(a.tanggal_transaksi).getTime()
      );

      return NextResponse.json({ 
        success: true, 
        data: {
          ...produk,
          kadaluarsa_items: kadaluarsaItems,
          total_masuk: produk.BarangMasuk.reduce((sum, item) => sum + item.jumlah, 0),
          total_keluar: produk.BarangKeluar.reduce((sum, item) => sum + item.jumlah, 0)
        }
      });
    }

    // Get all products with expiration filter
    const produkList = await prisma.produk.findMany({
      include: {
        BarangMasuk: {
          where: withExpired ? { masa_exp: { not: null } } : undefined
        },
        BarangKeluar: true,
      },
    });

    // Format response for all products
    const formattedProdukList = produkList.map(produk => {
      const kadaluarsaItems: KadaluarsaItem[] = [];

      // Process incoming items
      produk.BarangMasuk.forEach((masuk) => {
        const { status, sisa_hari } = calculateExpirationStatus(masuk.masa_exp);
        kadaluarsaItems.push({
          id: masuk.id,
          produk_id: masuk.produk_id,
          nama_produk: produk.nama_produk,
          jumlah: masuk.jumlah,
          tanggal_transaksi: masuk.tanggal_masuk,
          masa_exp: masuk.masa_exp,
          tipe: 'masuk',
          status_kadaluarsa: status,
          sisa_hari
        });
      });

      return {
        ...produk,
        kadaluarsa_items: kadaluarsaItems,
        total_masuk: produk.BarangMasuk.reduce((sum, item) => sum + item.jumlah, 0),
        total_keluar: produk.BarangKeluar.reduce((sum, item) => sum + item.jumlah, 0)
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: formattedProdukList 
    });

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
    const requestData = await request.json();
    
    const validationError = validateProdukData(requestData);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const newProduk = await prisma.produk.create({
      data: {
        nama_produk: requestData.nama_produk,
        kategori: requestData.kategori,
        harga: requestData.harga,
        stok: requestData.stok,
      },
    });

    return NextResponse.json(
      { success: true, data: newProduk },
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