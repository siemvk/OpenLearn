import { NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function GET() {
    try {
        const no_forum_access = await prisma.config.findFirst({
            where: { key: 'no_forum_access' },
        })

        const isForumBeschikbaar = !no_forum_access;

        return NextResponse.json({ isForumBeschikbaar }, { status: 200 });
    } catch (err) {
        console.error("Forum status error:", err);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
