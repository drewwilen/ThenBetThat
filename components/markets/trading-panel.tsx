"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatProbability } from "@/lib/utils";

interface Outcome {
  id: string;
  name: string;
  probability: number;
}

interface TradingPanelProps {
  outcome: Outcome;
  onTradeComplete?: () => void;
}

export function TradingPanel({ outcome, onTradeComplete }: TradingPanelProps) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePlaceOrder = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid quantity",
      });
      return;
    }

    if (orderType === "LIMIT" && (!price || parseFloat(price) <= 0 || parseFloat(price) >= 1)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Price must be between 0 and 1",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcomeId: outcome.id,
          side,
          type: orderType,
          quantity: parseFloat(quantity),
          price: orderType === "LIMIT" ? parseFloat(price) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to place order");
      }

      toast({
        title: "Success",
        description: "Order placed successfully",
      });

      setQuantity("");
      setPrice("");
      onTradeComplete?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade: {outcome.name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Current probability: {formatProbability(outcome.probability)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Position</Label>
            <div className="flex gap-2">
              <Button
                variant={side === "YES" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSide("YES")}
              >
                Buy YES
              </Button>
              <Button
                variant={side === "NO" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSide("NO")}
              >
                Buy NO
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Order Type</Label>
            <div className="flex gap-2">
              <Button
                variant={orderType === "MARKET" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setOrderType("MARKET")}
              >
                Market
              </Button>
              <Button
                variant={orderType === "LIMIT" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setOrderType("LIMIT")}
              >
                Limit
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {orderType === "LIMIT" && (
            <div className="space-y-2">
              <Label htmlFor="price">
                Price (probability for {side})
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                {side === "YES"
                  ? `You'll buy YES at ${price || "0"}. This matches with NO at ${
                      price ? (1 - parseFloat(price)).toFixed(2) : "1"
                    }`
                  : `You'll buy NO at ${price || "0"}. This matches with YES at ${
                      price ? (1 - parseFloat(price)).toFixed(2) : "1"
                    }`}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? "Placing order..." : `Place ${orderType} Order`}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <div className="text-sm font-semibold mb-2">How it works:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Buy YES if you think the outcome will happen</li>
            <li>• Buy NO if you think it won't happen</li>
            <li>• Market orders execute immediately at best price</li>
            <li>• Limit orders wait for your specified price</li>
            <li>• Prices represent probabilities (0-1)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
