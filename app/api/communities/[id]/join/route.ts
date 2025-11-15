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
    const { inviteCode } = body;

    const community = await prisma.community.findUnique({
      where: { id: params.id },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    if (community.members.length > 0) {
      return NextResponse.json(
        { error: "Already a member of this community" },
        { status: 400 }
      );
    }

    if (!community.isPublic) {
      if (!inviteCode || inviteCode !== community.inviteCode) {
        return NextResponse.json(
          { error: "Invalid invite code" },
          { status: 403 }
        );
      }
    }

    const member = await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: params.id,
        role: "MEMBER"
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error joining community:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
