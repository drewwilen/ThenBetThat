"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatProbability } from "@/lib/utils";
import { ArrowUp, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MarketCardProps {
  market: any;
  communityId: string;
  onUpdate?: () => void;
}

export function MarketCard({ market, communityId, onUpdate }: MarketCardProps) {
  const [isUpvoted, setIsUpvoted] = useState(market.upvotes?.length > 0);
  const [upvoteCount, setUpvoteCount] = useState(market._count?.upvotes || 0);
  const { toast } = useToast();

  const handleUpvote = async () => {
    try {
      const response = await fetch(`/api/markets/${market.id}/upvote`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsUpvoted(data.upvoted);
        setUpvoteCount(prev => data.upvoted ? prev + 1 : prev - 1);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upvote market",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/dashboard/communities/${communityId}/markets/${market.id}`}>
              <CardTitle className="hover:underline">{market.title}</CardTitle>
            </Link>
            {market.description && (
              <CardDescription className="mt-1">{market.description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={isUpvoted ? "default" : "outline"}
              size="sm"
              onClick={handleUpvote}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{upvoteCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {market.outcomes?.slice(0, 3).map((outcome: any) => (
            <div key={outcome.id} className="flex items-center justify-between">
              <span className="text-sm font-medium">{outcome.name}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${outcome.probability * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">
                  {formatProbability(outcome.probability)}
                </span>
              </div>
            </div>
          ))}
          {market.outcomes?.length > 3 && (
            <div className="text-sm text-muted-foreground">
              +{market.outcomes.length - 3} more outcomes
            </div>
          )}
        </div>
        <div className="mt-4">
          <Link href={`/dashboard/communities/${communityId}/markets/${market.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trade
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
