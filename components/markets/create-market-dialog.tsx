"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";

interface CreateMarketDialogProps {
  children: React.ReactNode;
  communityId: string;
  onCreate?: () => void;
}

export function CreateMarketDialog({ children, communityId, onCreate }: CreateMarketDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outcomes, setOutcomes] = useState<string[]>(["", ""]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      outcomes: outcomes.filter(o => o.trim()).map(name => ({ name })),
    };

    if (data.outcomes.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "At least 2 outcomes are required",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/markets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create market");
      }

      toast({
        title: "Success",
        description: "Market created successfully",
      });

      setOpen(false);
      setOutcomes(["", ""]);
      onCreate?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create market",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Market</DialogTitle>
          <DialogDescription>
            Create a prediction market with multiple outcomes
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Market Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Who will win the fantasy football league?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Additional details..."
            />
          </div>
          <div className="space-y-2">
            <Label>Outcomes (at least 2)</Label>
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={outcome}
                  onChange={(e) => {
                    const newOutcomes = [...outcomes];
                    newOutcomes[index] = e.target.value;
                    setOutcomes(newOutcomes);
                  }}
                  placeholder={`Outcome ${index + 1}`}
                  required={index < 2}
                />
                {index >= 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setOutcomes(outcomes.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOutcomes([...outcomes, ""])}
            >
              Add Outcome
            </Button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Market"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
