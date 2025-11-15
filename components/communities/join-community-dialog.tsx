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

interface JoinCommunityDialogProps {
  children: React.ReactNode;
  onJoin?: () => void;
}

export function JoinCommunityDialog({ children, onJoin }: JoinCommunityDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const inviteCode = formData.get("inviteCode") as string;

    try {
      // First, find the community by invite code
      const communitiesResponse = await fetch("/api/communities");
      if (!communitiesResponse.ok) {
        throw new Error("Failed to fetch communities");
      }

      const communities = await communitiesResponse.json();
      const community = communities.find((c: any) => c.inviteCode === inviteCode);

      if (!community) {
        throw new Error("Invalid invite code");
      }

      const response = await fetch(`/api/communities/${community.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join community");
      }

      toast({
        title: "Success",
        description: "Joined community successfully",
      });

      setOpen(false);
      onJoin?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join community",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Community</DialogTitle>
          <DialogDescription>
            Enter an invite code to join a private community
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              name="inviteCode"
              placeholder="ABC12345"
              required
              className="uppercase"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Joining..." : "Join Community"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
