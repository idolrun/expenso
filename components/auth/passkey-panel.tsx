"use client";

import { useState } from "react";
import { KeyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function PasskeySignInButton() {
  const [loading, setLoading] = useState(false);

  async function onSignIn() {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.passkey();
      if (error) {
        toast.error(error.message ?? "Passkey sign-in failed");
        return;
      }
      window.location.assign("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={loading}
      onClick={onSignIn}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="size-4" />
          Waiting for passkey…
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <KeyIcon className="size-4" />
          Sign in with passkey
        </span>
      )}
    </Button>
  );
}

export function PasskeyRegisterButton() {
  const [loading, setLoading] = useState(false);

  async function onAdd() {
    setLoading(true);
    try {
      const { error } = await authClient.passkey.addPasskey({
        name: typeof window !== "undefined" ? window.navigator.userAgent : "Passkey",
      });
      if (error) {
        toast.error(error.message ?? "Could not register passkey");
        return;
      }
      toast.success("Passkey registered for this account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={onAdd}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="size-4" />
          Registering…
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <KeyIcon className="size-4" />
          Register a passkey
        </span>
      )}
    </Button>
  );
}
