import { NextResponse } from "next/server";
import prisma from "../auth/option";

// Define types for Admin and UpdateAdmin
interface Admin {
  id?: number;
  nama: string;
  email: string;
  password: string;
}

// Create Admin
async function createAdmin(nama: string, email: string, password: string): Promise<Admin> {
  try {
    const newAdmin = await prisma.admin.create({
      data: {
        nama,
        email,
        password, // Anda bisa melakukan hashing password sebelum menyimpan
      },
    });
    return newAdmin;
  } catch (error) {
    throw new Error("Failed to create admin");
  }
}

// Get All Admins
async function getAdmins(): Promise<Admin[]> {
  try {
    const admins = await prisma.admin.findMany();
    return admins;
  } catch (error) {
    throw new Error("Failed to retrieve admins");
  }
}

async function getAdminById(id: number): Promise<Admin | null> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id },
    });
    return admin;
  } catch (error) {
    throw new Error("Failed to retrieve admin");
  }
}

// Unified GET function for both fetching all admins and a single admin by ID
export async function GET(request: Request, { params }: { params?: { id: string } }) {
  try {
    if (params && params.id) {
      // If 'id' parameter is provided, retrieve a single admin
      const adminId = parseInt(params.id, 10); // Ensure ID is a number
      if (isNaN(adminId)) {
        return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
      }

      const admin = await getAdminById(adminId);
      if (!admin) {
        return NextResponse.json({ message: "Admin not found" }, { status: 404 });
      }
      return NextResponse.json({ data : admin });
    }

    // If no 'id' parameter, retrieve all admins
    const admins = await getAdmins();
    return NextResponse.json({ admins });

  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

// POST - Create a new admin
export async function POST(request: Request) {
  try {
    const { nama, email, password }: Admin = await request.json();
    const newAdmin = await createAdmin(nama, email, password);
    return NextResponse.json({ message: "Admin created", admin: newAdmin }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
