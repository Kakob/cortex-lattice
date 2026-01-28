/**
 * Admin Problems API
 *
 * POST /api/admin/problems - Create a new problem
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { problemSchema } from "@/lib/schemas/problemSchema";
import { problemExists, writeProblemYaml } from "@/lib/admin/problemWriterServer";

// Admin email allowlist
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
].filter(Boolean);

/**
 * Check if user is authorized admin
 */
async function isAuthorizedAdmin(): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.email) {
    return false;
  }

  // In development, allow any authenticated user if no admin emails configured
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment && ADMIN_EMAILS.length === 0) {
    return true;
  }

  return ADMIN_EMAILS.includes(session.user.email);
}

/**
 * POST /api/admin/problems
 * Create a new problem
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate with Zod schema
    const parseResult = problemSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const problemData = parseResult.data;

    // Check if problem already exists
    if (await problemExists(problemData.id)) {
      return NextResponse.json(
        { error: `Problem with ID "${problemData.id}" already exists` },
        { status: 409 }
      );
    }

    // Write problem.yaml to disk
    await writeProblemYaml(problemData);

    return NextResponse.json(
      {
        success: true,
        problemId: problemData.id,
        message: `Problem "${problemData.title}" created successfully`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating problem:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}
