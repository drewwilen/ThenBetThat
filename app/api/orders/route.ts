import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MatchingEngine } from "@/lib/matching-engine";
import { OrderSide, OrderType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { outcomeId, side, type, quantity, price } = body;

    if (!outcomeId || !side || !type || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type === "LIMIT" && !price) {
      return NextResponse.json(
        { error: "Price required for limit orders" },
        { status: 400 }
      );
    }

    const order = await MatchingEngine.placeOrder(
      session.user.id,
      outcomeId,
      side as OrderSide,
      type as OrderType,
      parseFloat(quantity),
      price ? parseFloat(price) : 0.5
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
