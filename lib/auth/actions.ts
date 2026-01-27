"use server";

/**
 * Server actions for authentication
 */

import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

interface RegisterInput {
  name?: string;
  email: string;
  password: string;
}

interface RegisterResult {
  success?: boolean;
  error?: string;
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const { name, email, password } = input;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email address" };
  }

  // Validate password length
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "An account with this email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to create account. Please try again." };
  }
}
