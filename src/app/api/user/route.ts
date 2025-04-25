import { NextResponse } from "next/server";
import prisma from "../auth/option";
import bcrypt from 'bcrypt'

// Define types for Admin and UpdateAdmin
interface Admin {
  id?: number;
  nama: string;
  email: string;
  password: string;
}

// Create Admin
export async function POST(request: Request) {
  const { nama, email, password }: Admin = await request.json();

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  try {

    if (!nama || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    /// Check if the email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });
    if (existingAdmin) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const newAdmin = await prisma.admin.create({
      data: {
        nama,
        email,
        password: hashedPassword,
      },
    });
    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create admin" + error}, { status: 500 });
  }
}

// get all Admins
export async function GET() {
  try {
    const admins = await prisma.admin.findMany();
    return NextResponse.json(admins, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}



