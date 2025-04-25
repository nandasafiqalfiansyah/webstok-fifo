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


// reset password
export async function POST(request: Request) {
  const { userId, currentPassword, newPassword } = await request.json();

  try {
    // Find the admin by ID
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
    });

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    // Check if the current password is correct with bcrypt
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    const updatedAdmin = await prisma.admin.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: "Password updated successfully", updatedAdmin });
  } catch (error) {
    return NextResponse.json({ message: "Error updating password", error }, { status: 500 });
  }
}