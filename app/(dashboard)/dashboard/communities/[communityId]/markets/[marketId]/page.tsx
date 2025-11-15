"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingPanel } from "@/components/markets/trading-panel";
import { formatProbability } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface Outcome {
  id: string;
  name: string;
  description: string | null;
  probability: number;
  resolved: boolean;
  result: boolean | null;
}

interface Market {
  id: string;
  title: string;
  description: string | null;
  status: string;
  creatorId: string;
  outcomes: Outcome[];
}

export default function MarketPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const communityId = params.communityId as string;
  const marketId = params.marketId as string;
  const [market, setMarket] = useState<Market | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarket();
  }, [marketId]);

  const fetchMarket = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/markets`);
      if (response.ok) {
        const markets = await response.json();
        const found = markets.find((m: any) => m.id === marketId);
        setMarket(found || null);
        if (found && found.outcomes.length > 0) {
          setSelectedOutcome(found.outcomes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching market:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (outcomeId: string, result: boolean) => {
    try {
      const response = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId, result }),
      });

      if (response.ok) {
        fetchMarket();
      }
    } catch (error) {
      console.error("Error resolving outcome:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Market not found</div>
      </div>
    );
  }

  const isCreator = session?.user?.id === market.creatorId;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/communities/${communityId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{market.title}</h1>
          {market.description && (
            <p className="mt-2 text-muted-foreground">{market.description}</p>
          )}
          <div className="mt-2">
            <span
              className={`text-sm font-semibold ${
                market.status === "OPEN"
                  ? "text-green-600"
                  : market.status === "RESOLVED"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {market.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {market.outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selectedOutcome?.id === outcome.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedOutcome(outcome)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{outcome.name}</span>
                      <span className="text-sm font-semibold">
                        {formatProbability(outcome.probability)}
                      </span>
                    </div>
                    {outcome.resolved && (
                      <div className="mt-1 text-xs font-semibold">
                        Result: {outcome.result ? "YES" : "NO"}
                      </div>
                    )}
                    {isCreator && !outcome.resolved && market.status === "OPEN" && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(outcome.id, true);
                          }}
                        >
                          Resolve YES
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(outcome.id, false);
                          }}
                        >
                          Resolve NO
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedOutcome && market.status === "OPEN" && (
              <TradingPanel
                outcome={selectedOutcome}
                onTradeComplete={fetchMarket}
              />
            )}
            {market.status !== "OPEN" && (
              <Card>
                <CardContent className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      {market.status === "RESOLVED" ? "Market Resolved" : "Market Closed"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Trading is no longer available
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
