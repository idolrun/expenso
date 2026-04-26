"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { CredentialCopyButton } from "@/components/credentials/credential-copy-button";

export function CredentialPasswordField({
  password,
  showCopy = true,
}: {
  password: string | null;
  showCopy?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  if (!password) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className="group flex items-center gap-1">
      <span className="font-mono text-sm">
        {visible ? password : "••••••••"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
      </Button>
      {showCopy && <CredentialCopyButton value={password} label="Password" />}
    </div>
  );
}
