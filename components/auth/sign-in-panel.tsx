"use client";

import { useMemo } from "react";

import { MagicLinkForm } from "@/components/auth/magic-link-form";
import {
  PasskeyRegisterButton,
  PasskeySignInButton,
} from "@/components/auth/passkey-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

type SignInPanelProps = {
  authError?: string;
  authMessage?: string;
};

export function SignInPanel({ authError, authMessage }: SignInPanelProps) {
  const session = authClient.useSession();

  const banner = useMemo(() => {
    if (authMessage) {
      return { variant: "default" as const, title: "Notice", body: authMessage };
    }
    if (authError) {
      return {
        variant: "destructive" as const,
        title: "Something went wrong",
        body: authError,
      };
    }
    return null;
  }, [authError, authMessage]);

  return (
    <div className="space-y-6">
      {banner ? (
        <Alert variant={banner.variant}>
          <AlertTitle>{banner.title}</AlertTitle>
          <AlertDescription>{banner.body}</AlertDescription>
        </Alert>
      ) : null}

      {session.isPending ? (
        <p className="text-center text-muted-foreground text-sm">Loading session…</p>
      ) : session.data ? (
        <div className="space-y-3">
          <p className="text-center text-muted-foreground text-sm">
            You are already signed in. You can register a passkey for faster sign-in
            next time.
          </p>
          <PasskeyRegisterButton />
        </div>
      ) : (
        <>
          <MagicLinkForm />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <PasskeySignInButton />
        </>
      )}
    </div>
  );
}
