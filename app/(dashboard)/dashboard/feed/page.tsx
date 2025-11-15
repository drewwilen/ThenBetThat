"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketCard } from "@/components/markets/market-card";
import { ArrowLeft, TrendingUp } from "lucide-react";

interface Market {
  id: string;
  title: string;
  description: string | null;
  status: string;
  outcomes: any[];
  community: {
    id: string;
    name: string;
  };
  _count: {
    upvotes: number;
  };
  upvotes: any[];
}

export default function FeedPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      // Fetch all communities the user is in
      const communitiesResponse = await fetch("/api/communities");
      if (!communitiesResponse.ok) return;

      const communities = await communitiesResponse.json();

      // Fetch markets from all communities
      const allMarkets: Market[] = [];
      for (const community of communities) {
        const marketsResponse = await fetch(`/api/communities/${community.id}/markets`);
        if (marketsResponse.ok) {
          const communityMarkets = await marketsResponse.json();
          allMarkets.push(
            ...communityMarkets.map((m: any) => ({
              ...m,
              community: {
                id: community.id,
                name: community.name,
              },
            }))
          );
        }
      }

      // Sort by upvotes
      allMarkets.sort((a, b) => b._count.upvotes - a._count.upvotes);
      setMarkets(allMarkets);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Feed</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Trending Markets</h2>
          <p className="text-sm text-muted-foreground">
            Most upvoted markets from your communities
          </p>
        </div>

        {markets.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No markets yet</h3>
                <p className="text-sm text-muted-foreground">
                  Join communities and create markets to see them here
                </p>
                <Link href="/dashboard">
                  <Button className="mt-4">Browse Communities</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => (
              <div key={market.id}>
                <div className="mb-2 text-sm text-muted-foreground">
                  {market.community.name}
                </div>
                <MarketCard
                  market={market}
                  communityId={market.community.id}
                  onUpdate={fetchFeed}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
