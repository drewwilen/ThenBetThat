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

    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_marketId: {
          userId: session.user.id,
          marketId: params.id
        }
      }
    });

    if (existingUpvote) {
      await prisma.upvote.delete({
        where: {
          id: existingUpvote.id
        }
      });
      return NextResponse.json({ upvoted: false });
    } else {
      await prisma.upvote.create({
        data: {
          userId: session.user.id,
          marketId: params.id
        }
      });
      return NextResponse.json({ upvoted: true });
    }
  } catch (error) {
    console.error("Error toggling upvote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
