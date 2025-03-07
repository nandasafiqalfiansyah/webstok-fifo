import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

interface Admin {
  id?: number;
  nama: string;
  email: string;
  password: string;
}

async function getAdminById(id: number): Promise<Admin | null> {
  try {
    return await prisma.admin.findUnique({ where: { id } });
  } catch (error) {
    throw new Error("Failed to retrieve admin");
  }
}

async function updateAdminById(id: number, nama: string, email: string, password: string): Promise<Admin> {
  try {
    return await prisma.admin.update({
      where: { id },
      data: { nama, email, password }, // Hash password sebelum menyimpan
    });
  } catch (error) {
    throw new Error("Failed to update admin");
  }
}

// GET admin by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id, 10); // Pastikan ID dalam format angka
    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const user = await getAdminById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: user });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

// PUT: Update admin by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    // Ambil data user yang ada
    const existingUser = await getAdminById(userId);
    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Ambil data dari request body
    const body = await request.json();
    const { nama, email, password } = body;

    // Gunakan data lama jika input kosong
    const updatedUser = await updateAdminById(
      userId,
      nama || existingUser.nama,
      email || existingUser.email,
      password || existingUser.password // Jika password di-update, pastikan ada hash di sisi database
    );

    return NextResponse.json({ message: "User updated successfully", data: updatedUser  });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
