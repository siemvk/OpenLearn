import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const start = Date.now();
    const result = (await prisma.$runCommandRaw({ ping: 1 })) as { ok?: number } | unknown;
    const latencyMs = Date.now() - start;

    if ((result as any)?.ok !== 1) {
      throw new Error("Database ping failed");
    }

    return NextResponse.json({ status: "ok", db: "ok", latencyMs }, { status: 200 });
  } catch (err) {
    console.error("Healthcheck error:", err);
    return NextResponse.json({ status: "error", db: "down" }, { status: 500 });
  }
}
