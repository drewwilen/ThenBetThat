import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { outcomeId, result } = body;

    if (!outcomeId || typeof result !== "boolean") {
      return NextResponse.json(
        { error: "Invalid resolution data" },
        { status: 400 }
      );
    }

    // Verify user is the market creator
    const market = await prisma.market.findUnique({
      where: { id: params.id },
      include: {
        outcomes: true
      }
    });

    if (!market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    if (market.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only market creator can resolve outcomes" },
        { status: 403 }
      );
    }

    // Resolve the outcome
    const outcome = await prisma.outcome.update({
      where: { id: outcomeId },
      data: {
        resolved: true,
        result
      }
    });

    // Check if all outcomes are resolved
    const allOutcomes = await prisma.outcome.findMany({
      where: { marketId: params.id }
    });

    const allResolved = allOutcomes.every(o => o.resolved);

    if (allResolved) {
      await prisma.market.update({
        where: { id: params.id },
        data: { status: "RESOLVED" }
      });
    }

    return NextResponse.json(outcome);
  } catch (error) {
    console.error("Error resolving market:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
