"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { CredentialCopyButton } from "@/components/credentials/credential-copy-button";

export function CredentialPasswordField({
  password,
  showCopy = true,
  defaultVisible = false,
}: {
  password: string | null;
  showCopy?: boolean;
  defaultVisible?: boolean;
}) {
  const [visible, setVisible] = useState(defaultVisible);

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
        {visible ? <EyeSlash /> : <Eye />}
      </Button>
      {showCopy && <CredentialCopyButton value={password} label="Password" />}
    </div>
  );
}
