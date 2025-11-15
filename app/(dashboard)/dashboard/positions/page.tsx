"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatProbability } from "@/lib/utils";
import { ArrowLeft, TrendingUp } from "lucide-react";

interface Position {
  id: string;
  side: "YES" | "NO";
  quantity: number;
  avgPrice: number;
  outcome: {
    id: string;
    name: string;
    probability: number;
    market: {
      id: string;
      title: string;
      status: string;
      community: {
        id: string;
        name: string;
      };
    };
  };
}

export default function PositionsPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/positions");
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePL = (position: Position) => {
    const currentValue = position.side === "YES"
      ? position.outcome.probability
      : 1 - position.outcome.probability;
    const pl = (currentValue - position.avgPrice) * position.quantity;
    return pl;
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
              <h1 className="text-2xl font-bold">My Positions</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {positions.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No positions yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start trading in markets to build your portfolio
                </p>
                <Link href="/dashboard">
                  <Button className="mt-4">Browse Markets</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => {
              const pl = calculatePL(position);
              const plPercentage = (pl / (position.avgPrice * position.quantity)) * 100;

              return (
                <Card key={position.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{position.outcome.market.title}</CardTitle>
                        <CardDescription>
                          {position.outcome.market.community.name} • {position.outcome.name}
                        </CardDescription>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          position.outcome.market.status === "OPEN"
                            ? "text-green-600"
                            : position.outcome.market.status === "RESOLVED"
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        {position.outcome.market.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      <div>
                        <div className="text-sm text-muted-foreground">Position</div>
                        <div className="text-lg font-semibold">{position.side}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Quantity</div>
                        <div className="text-lg font-semibold">{position.quantity.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Price</div>
                        <div className="text-lg font-semibold">
                          {formatProbability(position.avgPrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Current</div>
                        <div className="text-lg font-semibold">
                          {formatProbability(
                            position.side === "YES"
                              ? position.outcome.probability
                              : 1 - position.outcome.probability
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">P/L</div>
                        <div
                          className={`text-lg font-semibold ${
                            pl >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {pl >= 0 ? "+" : ""}
                          {pl.toFixed(2)} ({plPercentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/communities/${position.outcome.market.community.id}/markets/${position.outcome.market.id}`}
                      >
                        <Button variant="outline" size="sm">
                          View Market
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
