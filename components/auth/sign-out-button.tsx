"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/lib/auth/actions/sign-out";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function PendingLabel() {
  const { pending } = useFormStatus();
  return pending ? (
    <span className="inline-flex items-center gap-2">
      <Spinner className="size-4" />
      Signing out…
    </span>
  ) : (
    "Sign out"
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        <PendingLabel />
      </Button>
    </form>
  );
}
