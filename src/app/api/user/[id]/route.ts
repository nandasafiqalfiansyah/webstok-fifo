import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

interface Admin {
  id?: number;
  nama: string;
  email: string;
  password: string;
}

// GET /api/user/:id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const user = await prisma.admin.findUnique({
      where: { id: Number(id) },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
}

// put /api/user/:id

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body: Admin = await request.json();
  try {
    const user = await prisma.admin.update({
      where: { id: Number(id) },
      data: body,
    });
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// delete /api/user/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const user = await prisma.admin.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
