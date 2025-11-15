"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCommunityDialog } from "@/components/communities/create-community-dialog";
import { JoinCommunityDialog } from "@/components/communities/join-community-dialog";
import { Plus, Users, TrendingUp } from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  _count: {
    markets: number;
    members: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCommunities();
    }
  }, [session]);

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities");
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">ThenBetThat</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/positions">
                <Button variant="ghost">My Positions</Button>
              </Link>
              <Link href="/dashboard/feed">
                <Button variant="ghost">Feed</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  fetch("/api/auth/signout", { method: "POST" }).then(() => {
                    router.push("/login");
                  });
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Communities</h2>
            <p className="text-muted-foreground">
              Join communities and trade prediction markets
            </p>
          </div>
          <div className="flex gap-2">
            <JoinCommunityDialog onJoin={fetchCommunities}>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Join Community
              </Button>
            </JoinCommunityDialog>
            <CreateCommunityDialog onCreate={fetchCommunities}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Community
              </Button>
            </CreateCommunityDialog>
          </div>
        </div>

        {communities.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No communities yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first community or join an existing one
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <Link key={community.id} href={`/dashboard/communities/${community.id}`}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>{community.name}</CardTitle>
                    <CardDescription>
                      {community.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{community._count.members} members</span>
                      <span>{community._count.markets} markets</span>
                    </div>
                    <div className="mt-2">
                      {community.isPublic ? (
                        <span className="text-xs text-green-600">Public</span>
                      ) : (
                        <span className="text-xs text-orange-600">Private</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
