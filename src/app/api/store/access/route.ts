import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSystemAdminEmail } from "@/lib/tenant";

const ALLOWED_ROLES = new Set(["OWNER", "MANAGER", "ADMIN"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim().toLowerCase();

    if (!slug) {
      return NextResponse.json({ canAccess: false });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ canAccess: false });
    }

    if (isSystemAdminEmail(session.user?.email)) {
      return NextResponse.json({ canAccess: true, role: "SYSTEM_ADMIN" });
    }

    const membership = await prisma.storeUser.findFirst({
      where: {
        userId,
        store: {
          slug
        }
      },
      select: {
        role: true
      }
    });

    if (!membership) {
      return NextResponse.json({ canAccess: false });
    }

    const role = String(membership.role || "").toUpperCase();
    return NextResponse.json({ canAccess: ALLOWED_ROLES.has(role), role });
  } catch {
    return NextResponse.json({ canAccess: false });
  }
}
