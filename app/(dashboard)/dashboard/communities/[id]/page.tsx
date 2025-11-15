"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateMarketDialog } from "@/components/markets/create-market-dialog";
import { CommunityChat } from "@/components/communities/community-chat";
import { MarketCard } from "@/components/markets/market-card";
import { ArrowLeft, Plus } from "lucide-react";

interface Market {
  id: string;
  title: string;
  description: string | null;
  status: string;
  outcomes: any[];
  _count: {
    upvotes: number;
  };
  upvotes: any[];
}

interface Community {
  id: string;
  name: string;
  description: string | null;
}

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunity();
    fetchMarkets();
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      const response = await fetch("/api/communities");
      if (response.ok) {
        const communities = await response.json();
        const found = communities.find((c: any) => c.id === communityId);
        setCommunity(found || null);
      }
    } catch (error) {
      console.error("Error fetching community:", error);
    }
  };

  const fetchMarkets = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/markets`);
      if (response.ok) {
        const data = await response.json();
        setMarkets(data);
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
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

  if (!community) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Community not found</div>
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
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">{community.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="markets" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>
            <CreateMarketDialog communityId={communityId} onCreate={fetchMarkets}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Market
              </Button>
            </CreateMarketDialog>
          </div>

          <TabsContent value="markets" className="space-y-4">
            {markets.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[200px] items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">No markets yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Create the first market in this community
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {markets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    communityId={communityId}
                    onUpdate={fetchMarkets}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <CommunityChat communityId={communityId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
