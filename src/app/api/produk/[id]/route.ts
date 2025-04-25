import { NextResponse } from "next/server";
import prisma from "../../auth/option";

interface Produk {
    id?: number;
    nama_produk: string;
    kategori: string;
    harga: number;
    stok: number;
  }

function validateProdukData(data: Partial<Produk>): string | null {
    if (!data.nama_produk) return "Nama produk harus diisi";
    if (!data.kategori) return "Kategori harus diisi";
    if (data.harga === undefined || data.harga <= 0) return "Harga harus lebih dari 0";
    if (data.stok === undefined || data.stok < 0) return "Stok tidak boleh negatif";
    return null;
  }


export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
      const { id } = params;
      const body = await request.json();
      const { nama_produk, kategori, harga, stok } = body;
  
      // Validate ID
      const produkId = parseInt(id);
      if (isNaN(produkId)) {
        return NextResponse.json(
          { success: false, message: "ID produk tidak valid" },
          { status: 400 }
        );
      }
  
      // Validate input data
      const validationError = validateProdukData(body);
      if (validationError) {
        return NextResponse.json(
          { success: false, message: validationError },
          { status: 400 }
        );
      }
  
      // Update product
      const produk = await prisma.produk.update({
        where: { id: produkId },
        data: {
          nama_produk,
          kategori,
          harga: Number(harga),
          stok: Number(stok),
        },
      });
      return NextResponse.json(
        { success: true, data: produk },
        { status: 200 }
      );
  
    } catch (error) {
      console.error(`Error in PUT /api/produk/${params.id}:`, error);
      if (error instanceof Error && error.message.includes("RecordNotFound")) {
        return NextResponse.json(
          { success: false, message: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }
  
      return NextResponse.json(
        { success: false, message: "Gagal memperbarui produk" },
        { status: 500 }
      );
    }
  }
  
  export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
      const { id } = params;
  
      // Validate ID
      const produkId = parseInt(id);
      if (isNaN(produkId)) {
        return NextResponse.json(
          { success: false, message: "ID produk tidak valid" },
          { status: 400 }
        );
      }
  
      // Check if product exists first
      const existingProduk = await prisma.produk.findUnique({
        where: { id: produkId },
      });
  
      if (!existingProduk) {
        return NextResponse.json(
          { success: false, message: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }
  
      // Delete product
      const produk = await prisma.produk.delete({
        where: { id: produkId },
      });
  
      return NextResponse.json(
        { success: true, data: produk },
        { status: 200 }
      );
  
    } catch (error) {
      console.error(`Error in DELETE /api/produk/${params.id}:`, error);
      
      // Handle foreign key constraint violation
      if (error instanceof Error && error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Tidak dapat menghapus produk karena terdapat data barang masuk/keluar yang terkait" 
          },
          { status: 400 }
        );
      }
  
      return NextResponse.json(
        { success: false, message: "Gagal menghapus produk" },
        { status: 500 }
      );
    }
  }