"use client";

import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { getPublicAppUrl } from "@/lib/env/public-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSent(false);
    try {
      const { error } = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: `${getPublicAppUrl()}/dashboard`,
      });
      if (error) {
        toast.error(error.message ?? "Could not send magic link");
        return;
      }
      setSent(true);
      toast.success("Check your email for the sign-in link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="size-4" />
            Sending link…
          </span>
        ) : (
          "Email me a magic link"
        )}
      </Button>
      {sent ? (
        <p className="text-muted-foreground text-center text-xs">
          In local development, the link is printed in the server console if email
          is not configured.
        </p>
      ) : null}
    </form>
  );
}
