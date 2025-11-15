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

interface CreateCommunityDialogProps {
  children: React.ReactNode;
  onCreate?: () => void;
}

export function CreateCommunityDialog({ children, onCreate }: CreateCommunityDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      isPublic: formData.get("isPublic") === "on",
    };

    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create community");
      }

      const community = await response.json();

      toast({
        title: "Success",
        description: community.inviteCode
          ? `Community created! Invite code: ${community.inviteCode}`
          : "Community created successfully",
      });

      setOpen(false);
      onCreate?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create community",
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
          <DialogTitle>Create Community</DialogTitle>
          <DialogDescription>
            Create a new community for prediction markets
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Prediction Community"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="A community for..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              defaultChecked
              className="h-4 w-4"
            />
            <Label htmlFor="isPublic">Public (anyone can join)</Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Community"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
