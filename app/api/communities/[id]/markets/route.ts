import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const markets = await prisma.market.findMany({
      where: {
        communityId: params.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        outcomes: {
          include: {
            _count: {
              select: {
                orders: true,
                positions: true
              }
            }
          }
        },
        _count: {
          select: {
            upvotes: true
          }
        },
        upvotes: {
          where: {
            userId: session.user.id
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(markets);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { title, description, outcomes, closesAt } = body;

    if (!title || !outcomes || !Array.isArray(outcomes) || outcomes.length < 2) {
      return NextResponse.json(
        { error: "Invalid market data" },
        { status: 400 }
      );
    }

    // Verify user is member of community
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: params.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Must be a member to create markets" },
        { status: 403 }
      );
    }

    const market = await prisma.market.create({
      data: {
        title,
        description,
        communityId: params.id,
        creatorId: session.user.id,
        closesAt: closesAt ? new Date(closesAt) : null,
        outcomes: {
          create: outcomes.map((outcome: { name: string; description?: string }) => ({
            name: outcome.name,
            description: outcome.description,
            probability: 1 / outcomes.length // Equal initial probability
          }))
        }
      },
      include: {
        outcomes: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(market, { status: 201 });
  } catch (error) {
    console.error("Error creating market:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
